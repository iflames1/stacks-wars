import { apiRequest } from "@/lib/api";
import { getClaimFromJwt } from "@/lib/getClaimFromJwt";
import { getBalamce } from "@/lib/stacks-api-client";
import { User } from "@/types/schema/user";
import { redirect } from "next/navigation";

const fetchUser = async () => {
	try {
		const userId = await getClaimFromJwt<string>("sub");
		if (!userId) {
			return;
		}

		const userData = await apiRequest<User>({
			path: `/user/${userId}`,
			method: "GET",
		});
		return userData;
	} catch (error) {
		console.error("Failed to fetch user:", error);
	}
};

export default async function StacksSweepers() {
	const user = await fetchUser();
	if (!user) {
		redirect("/");
	}
	console.log(user);
	const balance = await getBalamce(user?.walletAddress);
	console.log(balance);
	return <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6"></div>;
}
