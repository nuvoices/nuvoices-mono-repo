import { client } from "@/sanity/client";
import { SanityDocument } from "next-sanity";

export const runtime = "edge";

export async function generateStaticParams() {
  try {
    const experts = await client.fetch<SanityDocument[]>(`*[_type == "expert"]{ _id }`);
    
    if (!experts || experts.length === 0) {
      return [];
    }
    
    return experts.map((expert) => ({
      expert: expert._id,
    }));
  } catch (error) {
    console.error('Error fetching experts:', error);
    return [];
  }
}

export default async function ExpertPage({ 
  params 
}: { 
  params: Promise<{ expert: string }> 
}) {
  const { expert: expertId } = await params;
  const expert = await client.fetch<SanityDocument>(`*[_type == "expert" && _id == "${expertId}"][0]`)

  return <div>{expert.name}</div>
}