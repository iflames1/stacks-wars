"use server";

import { cookies } from "next/headers";
import { toast } from "sonner";
import { revalidateTag } from "next/cache";

export async function connectOrCreateUser(walletAddress: string) {
	const cookieStore = await cookies();
	try {
		const apiRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
			method: "POST",
			body: JSON.stringify({ wallet_address: walletAddress }),
			headers: {
				"Content-Type": "application/json",
			},
			next: { tags: ["user"] },
		});

		if (!apiRes.ok) {
			throw new Error("Failed to create or login user");
		}

		const token = await apiRes.json();
		console.log(token);

		cookieStore.set("jwt", token, {
			httpOnly: true,
			secure: true,
			maxAge: 60 * 60 * 24, // 1 day
			path: "/",
		});

		revalidateTag("user");

		toast.success("Wallet connected successfully!");

		return { success: true };
	} catch (err) {
		console.error(err);
		return { success: false, message: "Connection or login failed." };
	}
}

export async function logoutUser() {
	const cookieStore = await cookies();

	try {
		cookieStore.delete("jwt");
		revalidateTag("user");

		return { success: true };
	} catch {
		return { success: false, message: "Logout failed." };
	}
}
