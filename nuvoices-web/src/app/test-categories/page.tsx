import { client } from "@/sanity/client";
import { groq } from "next-sanity";

export default async function TestCategoriesPage() {
  // Get all categories
  const allCategories = await client.fetch(groq`
    *[_type == "category"] {
      _id,
      title,
      slug,
      wpNicename
    }
  `);

  // Check if magazine category exists
  const magazineCategory = await client.fetch(groq`
    *[_type == "category" && slug.current == "magazine"][0] {
      _id,
      title,
      slug
    }
  `);

  // Get posts with their categories
  const postsWithCategories = await client.fetch(groq`
    *[_type == "post" && defined(categories) && status == "published"][0...10] {
      _id,
      title,
      status,
      categories[]->{
        _id,
        title,
        slug
      }
    }
  `);

  // Count posts with any categories
  const postsWithCategoriesCount = await client.fetch(groq`
    count(*[_type == "post" && defined(categories) && count(categories) > 0])
  `);

  // Test the exact magazine query
  const magazinePosts = await client.fetch(groq`
    *[_type == "post" && status == "published" && "magazine" in categories[]->slug.current] {
      _id,
      title
    }
  `);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Category Debug Page</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">All Categories in Sanity</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(allCategories, null, 2)}
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Magazine Category Check</h2>
        <div className="bg-yellow-100 p-4 rounded">
          {magazineCategory ? (
            <div>
              <p className="font-semibold text-green-700">✅ Magazine category exists!</p>
              <pre className="mt-2">{JSON.stringify(magazineCategory, null, 2)}</pre>
            </div>
          ) : (
            <p className="font-semibold text-red-700">❌ No magazine category found with slug "magazine"</p>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Posts with Categories (Sample of 10)</h2>
        <div className="space-y-4">
          {postsWithCategories.map((post: any) => (
            <div key={post._id} className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold">{post.title}</h3>
              <p className="text-sm text-gray-600">Status: {post.status}</p>
              <p className="text-sm">Categories: {post.categories?.map((cat: any) => `${cat.title} (${cat.slug.current})`).join(', ') || 'None'}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Total posts with categories: {postsWithCategoriesCount}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Magazine Query Results</h2>
        <div className="bg-blue-100 p-4 rounded">
          <p className="mb-2">Query: <code className="text-sm bg-white px-2 py-1 rounded">*[_type == "post" && status == "published" && "magazine" in categories[]->slug.current]</code></p>
          <p className="font-semibold">Found {magazinePosts.length} posts</p>
          {magazinePosts.length > 0 && (
            <ul className="mt-2">
              {magazinePosts.map((post: any) => (
                <li key={post._id}>{post.title}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting Tips</h2>
        <div className="bg-gray-100 p-4 rounded space-y-2">
          <p>1. If no magazine category exists, create one in Sanity Studio with slug "magazine"</p>
          <p>2. If category exists but no posts are assigned, edit posts in Sanity Studio and add the magazine category</p>
          <p>3. If category has a different slug, update your query or the category slug</p>
          <p>4. Check if categories were imported from WordPress with different slugs (check wpNicename field)</p>
        </div>
      </section>
    </div>
  );
}