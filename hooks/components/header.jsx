"use client";

import {
  SignInButton,
  UserButton,
  useUser
} from "@clerk/nextjs";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FolderOpen, PenBox, LayoutDashboard } from "lucide-react";

const Header = () => {
  const { isSignedIn } = useUser(); // ✅ CLIENT SAFE

  return (
    <header className="container mx-auto">
      <nav className="py-6 px-4 flex justify-between items-center">
        
        <Link href="/">
          <Image
            src="/logo.png"
            alt="Reflct Logo"
            width={200}
            height={60}
            loading="eager"
            className="h-10 w-auto object-contain"
          />
        </Link>

        <div className="flex items-center gap-4">

          {!isSignedIn ? (
            <>
              <Link href="/journal/write">
                <Button variant="journal">
                  <PenBox size={18} />
                  <span className="hidden md:inline">Write New</span>
                </Button>
              </Link>

              <SignInButton mode="modal">
                <Button variant="outline">
                  Login
                </Button>
              </SignInButton>
            </>
          ) : (
            <>
              <Link href="/dashboard">
                <Button variant="outline" className="flex items-center gap-2">
                  <LayoutDashboard size={18} />
                  <span className="hidden md:inline">Dashboard</span>
                </Button>
              </Link>

              <Link href="/dashboard/collections">
                <Button variant="outline" className="flex items-center gap-2">
                  <FolderOpen size={18} />
                  <span className="hidden md:inline">Collections</span>
                </Button>
              </Link>

              <Link href="/journal/write">
                <Button variant="journal">
                  <PenBox size={18} />
                  <span className="hidden md:inline">Write New</span>
                </Button>
              </Link>

              <UserButton />
            </>
          )}

        </div>

      </nav>
    </header>
  );
};

export default Header;