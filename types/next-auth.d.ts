import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "ADMIN" | "CUSTOMER";
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "CUSTOMER";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "CUSTOMER";
  }
}