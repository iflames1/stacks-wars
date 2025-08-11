import { apiRequest } from "@/lib/api";
import { getClaimFromJwt } from "@/lib/getClaimFromJwt";
import { LeaderBoard } from "@/types/schema/leaderboard";
import { notFound } from "next/navigation";
import ProfileHeader from "./_components/profile-header";
import ProfileStats from "./_components/profile-stats";
import ProfileEdit from "./_components/profile-edit";
import UnclaimedRewards from "./_components/unclaimed-rewards";

export default async function ProfilePage({
	params,
}: {
	params: Promise<{ identifier: string }>;
}) {
	const identifier = (await params).identifier;

	try {
		// Fetch user profile data
		const userProfile = await apiRequest<LeaderBoard>({
			path: `/user/stat?identifier=${encodeURIComponent(identifier)}`,
			method: "GET",
			auth: false,
			cache: "no-store",
		});

		// Check if current user is the profile owner
		const currentUserId = await getClaimFromJwt<string>("sub");
		const isOwner = currentUserId === userProfile.user.id;

		return (
			<div className="container mx-auto px-4 py-8 max-w-4xl">
				<div className="space-y-6">
					<ProfileHeader user={userProfile.user} isOwner={isOwner} />
					<ProfileStats profile={userProfile} />
					{isOwner && (
						<>
							<UnclaimedRewards />
							<ProfileEdit user={userProfile.user} />
						</>
					)}
				</div>
			</div>
		);
	} catch (error) {
		console.error("Failed to fetch user profile:", error);
		notFound();
	}
}
