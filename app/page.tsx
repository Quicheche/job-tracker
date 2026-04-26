import { getAllJobs } from "@/lib/jobs";
import JobTable from "@/components/JobTable";
import AddJobForm from "@/components/AddJobForm";
import ImportForm from "@/components/ImportForm";
import PasteImportForm from "@/components/PasteImportForm";
import WatchlistImport from "@/components/WatchlistImport";

export default function Home() {
  const jobs = getAllJobs();

  return (
    <main className="page">
      <h1 className="page-title">Job Tracker</h1>
      <JobTable jobs={jobs} />
      <WatchlistImport />
      <ImportForm />
      <PasteImportForm />
      <AddJobForm />
    </main>
  );
}
