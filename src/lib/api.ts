"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";

type JSONValue = string | number | boolean | null | JSONObject | JSONValue[];

interface JSONObject {
	[key: string]: JSONValue;
}

type JSON = JSONValue;

export interface ApiRequestProps {
	path: string;
	method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	body?: JSONObject;
	tag?: string | string[];
	revalidateTag?: string;
	revalidatePath?: string;
	cache?: "no-store" | "force-cache";
}

export const apiRequest = async <T = JSON>({
	path,
	method = "GET",
	body,
	tag,
	revalidateTag: tagToRevalidate,
	revalidatePath: pathToRevalidate,
	cache = "no-store",
}: ApiRequestProps): Promise<T> => {
	const cookieStore = await cookies();
	const jwt = cookieStore.get("jwt");

	if (!jwt) {
		throw new Error("You must be logged in to perform this action");
	}

	const headers: HeadersInit = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${jwt.value}`,
	};

	const normalizedPath = path.startsWith("/") ? path : `/${path}`;

	const res = await fetch(
		`${process.env.NEXT_PUBLIC_API_URL}${normalizedPath}`,
		{
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
			cache,
			next: tag ? { tags: Array.isArray(tag) ? tag : [tag] } : undefined,
		}
	);

	if (!res.ok) {
		if (res.status === 401) {
			throw new Error("Unauthorized – maybe you need to log in again?");
		}
		if (res.status === 403) {
			throw new Error("Forbidden – you don’t have access.");
		}
		const text = await res.text();
		throw new Error(text || "Request failed");
	}

	if (tagToRevalidate) {
		revalidateTag(tagToRevalidate);
	}

	if (pathToRevalidate) {
		revalidatePath(pathToRevalidate);
	}

	return res.json() as Promise<T>;
};
