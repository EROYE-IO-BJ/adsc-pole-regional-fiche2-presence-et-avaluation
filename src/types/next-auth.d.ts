import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      serviceId: string;
      serviceName: string;
      serviceType: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    serviceId?: string;
    serviceName?: string;
    serviceType?: string;
  }
}
