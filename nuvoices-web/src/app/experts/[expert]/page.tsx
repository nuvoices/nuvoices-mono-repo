import { client } from "@/sanity/client";
import { SanityDocument } from "next-sanity";

export default async function ExpertPage({ params }: { params: { expert: string } }) {
  const expert = await client.fetch<SanityDocument>(`*[_type == "expert" && _id == "${params.expert}"][0]`)

  return <div>{expert.name}</div>
}