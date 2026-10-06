import React from "react";
import { checkUser } from "@/lib/checkUser";

// Sync Clerk users into the database before protected pages render
const layout = async ({ children }) => {
  await checkUser();

  return <div className="container mx-auto">{children}</div>;
};

export default layout;
