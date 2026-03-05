import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth, handleAuthError } from "@/lib/authorization";
import { Role } from "@prisma/client";

const anthropic = new Anthropic();

const EXTRACTION_PROMPT = `Tu es un assistant spécialisé dans l'extraction de données depuis des fiches de présence scannées.

Analyse ce document PDF qui est une fiche de présence (feuille d'émargement). Extrais les informations suivantes :

1. **Métadonnées** (si visibles) : objet/titre de l'activité, date, lieu, animateur/intervenant
2. **Liste des participants** : Pour chaque ligne du tableau, extrais :
   - Prénom (firstName)
   - Nom (lastName)
   - Email (email)
   - Téléphone (phone) - peut être absent
   - Organisation (organization) - peut être absent
   - Signé (signed) : true si une signature est présente sur la ligne, false sinon

RÈGLES IMPORTANTES :
- Si un champ est illisible ou incertain, mets "???" comme valeur et confidence: "low"
- Si un champ est clairement lisible, mets confidence: "high"
- Ne devines PAS les emails - si illisible, mets "???"
- Ignore les lignes complètement vides
- Les noms manuscrits peuvent être difficiles à lire, fais de ton mieux

Réponds UNIQUEMENT avec du JSON valide dans ce format exact :
{
  "metadata": {
    "objet": "string ou null",
    "date": "string ou null",
    "lieu": "string ou null",
    "animateur": "string ou null"
  },
  "participants": [
    {
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phone": "string ou null",
      "organization": "string ou null",
      "signed": true,
      "confidence": "high" | "low"
    }
  ]
}`;

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch (error) {
    const { error: msg, status } = handleAuthError(error);
    return NextResponse.json({ error: msg }, { status });
  }

  if (user.role !== Role.ADMIN && user.role !== Role.RESPONSABLE_SERVICE) {
    return NextResponse.json({ error: "Accès insuffisant" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Un fichier PDF est requis" },
        { status: 400 }
      );
    }

    if (file.size > 32 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Le fichier ne doit pas dépasser 32 Mo" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "Aucune réponse de l'IA" },
        { status: 500 }
      );
    }

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = textBlock.text.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonText);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("PDF parse error:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Erreur lors de l'analyse de la réponse IA" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Erreur lors de l'analyse du PDF" },
      { status: 500 }
    );
  }
}
