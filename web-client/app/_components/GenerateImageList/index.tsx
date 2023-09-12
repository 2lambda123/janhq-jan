import Image from "next/image";
import GenerateImageCard from "../GenerateImageCard";
import { ProductDetailFragment } from "@/graphql";

type Props = {
  products: ProductDetailFragment[];
};

const GenerateImageList: React.FC<Props> = ({ products }) => {
  if (products.length === 0) {
    return <div></div>;
  }

  return (
    <div className="pb-4">
      <div className="flex mt-4 justify-between">
        <div className="gap-4 flex items-center">
          <Image src={"icons/ic_image.svg"} width={20} height={20} alt="" />
          <p className="text-xl dark:text-white">
            Generate Images
          </p>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-6 sm:gap-x-6 md:grid-cols-4 md:gap-8">
        {products.map((item) => (
          <GenerateImageCard key={item.name} product={item} />
        ))}
      </div>
    </div>
  );
};

export default GenerateImageList;
