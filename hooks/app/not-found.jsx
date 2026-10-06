import React from 'react'
import Link from "next/link";
import { Button } from "@/components/ui/button";


const Notfound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-6xl font-bold gradient-title mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-8">
        Oops! The page you&apos;re looking for does&apos;t exist
        or has been 
        moved or deleted.
      </p>
      <Link href="/">
        <Button variant="journal">Return Home</Button>
      </Link>
    </div>
  );
};

export default Notfound;
