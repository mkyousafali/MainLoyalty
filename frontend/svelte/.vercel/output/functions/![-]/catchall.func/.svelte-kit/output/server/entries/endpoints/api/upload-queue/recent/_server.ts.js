import { error, json } from "@sveltejs/kit";
const BACKEND_URL = "http://localhost:8080";
const GET = async ({ url, fetch }) => {
  try {
    const limit = url.searchParams.get("limit") || "10";
    const response = await fetch(`${BACKEND_URL}/api/uploads/jobs?limit=${limit}`);
    if (!response.ok) {
      throw error(response.status, "Failed to fetch recent uploads");
    }
    const result = await response.json();
    const jobs = result.jobs || [];
    const sortedJobs = jobs.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return json(sortedJobs.slice(0, parseInt(limit)));
  } catch (err) {
    console.error("Recent uploads fetch error:", err);
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    throw error(500, "Failed to fetch recent uploads");
  }
};
export {
  GET
};
