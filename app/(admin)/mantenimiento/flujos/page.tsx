import { Metadata } from "next";
import { PageContent } from "./components";

export const metadata: Metadata = {
  title: "Flujos",
  description: "Define los flujos y estados del pedido.",
};

export default function Page() {
  return <PageContent />;
}