import { Hero } from "@/components/home/Hero";
import { BenefitsBar } from "@/components/layout/BenefitsBar";
import { NewArrivals } from "@/components/home/NewArrivals";
import { PromoVideo } from "@/components/home/PromoVideo";
import { CategoryGrid } from "@/components/home/CategoryGrid";

export default function Home() {
  return (
    <div className="w-full flex flex-col flex-grow">
      <Hero />
      <BenefitsBar />
      <NewArrivals />
      <PromoVideo />
      <CategoryGrid />
    </div>
  );
}
