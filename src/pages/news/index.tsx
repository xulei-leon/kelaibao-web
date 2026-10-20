import { PublicListPage } from "@/components/public-content-pages";
import { staticListProps } from "@/lib/static-content-pages";

export function getStaticProps() { return staticListProps("news"); }
export default PublicListPage;
