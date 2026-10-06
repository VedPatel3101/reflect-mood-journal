import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export const checkUser = async () => {
    const user = await currentUser(); // ✅ SERVER ONLY

    if (!user) {
        console.log("NO USER FROM CLERK");
        return null;
    }

    try {
        const loggedInUser = await db.user.findFirst({
            where: {
                clerkUserId: user.id,
            },
        });

        if (loggedInUser) {
            return loggedInUser;
        }

        const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`;

        const newUser = await db.user.create({
            data: {
                clerkUserId: user.id,
                name,
                imageUrl: user?.imageUrl,
                email: user?.emailAddresses?.[0]?.emailAddress,
            },
        });

        console.log("USER CREATED:", newUser);

        return newUser;

    } catch (error) {
        console.log("ERROR:", error);
        return null;
    }
};