import { client } from "@/sanity/client";
import { SanityDocument } from "next-sanity";

export const runtime = "edge";
export const revalidate = 3600; // Revalidate every hour

export default async function ExpertPage({ 
  params 
}: { 
  params: Promise<{ expert: string }> 
}) {
  const { expert: expertId } = await params;
  const expert = await client.fetch<SanityDocument>(`*[_type == "expert" && _id == "${expertId}"][0]`)

  return <div>{expert.name}</div>
}