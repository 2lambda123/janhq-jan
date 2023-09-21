type Props = {
  title: string;
};

export const DownloadModelTitle: React.FC<Props> = ({ title }) => (
  <div className="py-[2px] px-[10px] bg-purple-100 rounded-md text-center">
    <span className="text-xs leading-[18px] font-medium text-purple-800">
      {title}
    </span>
  </div>
);

export default DownloadModelTitle;
