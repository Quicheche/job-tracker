import { getAllJobs } from "@/lib/jobs";
import JobTable from "@/components/JobTable";
import AddJobForm from "@/components/AddJobForm";

export default function Home() {
  const jobs = getAllJobs();

  return (
    <main className="page">
      <h1 className="page-title">Job Tracker</h1>
      <JobTable jobs={jobs} />
      <AddJobForm />
    </main>
  );
}
