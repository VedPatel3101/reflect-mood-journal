"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useState } from "react";
import Link from "next/link";

const UserMenu = () => {
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      
      {/* Avatar */}
      <img
        src={user.imageUrl}
        alt="user"
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full cursor-pointer"
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg p-2">

          {/* Dashboard */}
          <Link
            href="/dashboard"
            className="block px-4 py-2 hover:bg-gray-100 rounded"
          >
            Dashboard
          </Link>

          {/* Manage Account */}
          <a
            href="/user"
            className="block px-4 py-2 hover:bg-gray-100 rounded"
          >
            Manage account
          </a>

          {/* Sign Out */}
          <SignOutButton>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
              Sign out
            </button>
          </SignOutButton>

        </div>
      )}
    </div>
  );
};

export default UserMenu;