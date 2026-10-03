import { Category } from "@/types/category";

const basePath = "/assets/Images/homepage cateogries images";

export const categories: Category[] = [
  {
    id: "cat_1",
    slug: "player-version",
    title: "Player Version",
    image: `${basePath}/player version.jpg`,
    className: "md:col-span-2 md:row-span-2",
  },
  {
    id: "cat_2",
    slug: "half-sleeve",
    title: "Half Sleeve",
    image: `${basePath}/half.png`,
    imageClassName: "object-cover object-top",
  },
  {
    id: "cat_3",
    slug: "five-sleeve",
    title: "Five Sleeve",
    image: `${basePath}/five.jpg`,
    imageClassName: "object-cover object-[center_20%]",
  },
  {
    id: "cat_4",
    slug: "full-sleeve",
    title: "Full Sleeve",
    image: `${basePath}/full seelve.jpg`,
    className: "md:col-span-2",
    imageClassName: "object-cover object-top",
  },
  {
    id: "cat_5",
    slug: "national-kits",
    title: "National Kits",
    image: `${basePath}/national.jpg`,
    className: "md:col-span-2",
  },
  {
    id: "cat_6",
    slug: "season-kits",
    title: "Season Kits",
    image: `${basePath}/seasonal.jpg`,
  },
  {
    id: "cat_7",
    slug: "full-kit",
    title: "Full Kit",
    image: `${basePath}/full kit.jpg`,
  },
  {
    id: "cat_8",
    slug: "bibs",
    title: "Bibs",
    image: `${basePath}/bibs.jpg`,
    imageClassName: "object-cover object-top",
  },
  {
    id: "cat_9",
    slug: "cricket",
    title: "Cricket",
    image: `${basePath}/cricket.jpg`,
    imageClassName: "object-cover object-top",
  },
  {
    id: "cat_10",
    slug: "special-edition",
    title: "Special Edition",
    image: `${basePath}/special.png`,
    className: "md:col-span-2 md:row-span-2",
    imageClassName: "object-cover object-center",
  },
  {
    id: "cat_11",
    slug: "shorts",
    title: "Shorts",
    image: `${basePath}/shorts.jpg`,
    className: "bg-white",
    imageClassName: "object-contain bg-white p-4",
  },
  {
    id: "cat_12",
    slug: "kids",
    title: "Kids",
    image: `${basePath}/kids.jpg`,
    className: "bg-white",
    imageClassName: "object-contain bg-white p-4",
  },
  {
    id: "cat_13",
    slug: "exclusive-offer",
    title: "Exclusive Offer",
    image: `${basePath}/exclusive.jpg`,
    className: "col-span-2 md:col-span-4 row-span-1 md:h-64",
    imageClassName: "object-cover object-[center_30%]",
  }
];
