import React from "react";
import TextInputWithTitle from "../TextInputWithTitle";
import TextAreaWithTitle from "../TextAreaWithTitle";
import DropdownBox from "../DropdownBox";
import PrimaryButton from "../PrimaryButton";
import ToggleSwitch from "../ToggleSwitch";
import CreateBotInAdvance from "../CreateBotInAdvance";
import CreateBotPromptInput from "../CreateBotPromptInput";
import { useGetDownloadedModels } from "@/_hooks/useGetDownloadedModels";
import useCreateBot from "@/_hooks/useCreateBot";
import { Bot } from "@/_models/Bot";
import { SubmitHandler, useForm } from "react-hook-form";
import Avatar from "../Avatar";
import { v4 as uuidv4 } from "uuid";

const CreateBotContainer: React.FC = () => {
  const { downloadedModels } = useGetDownloadedModels();
  const { createBot } = useCreateBot();

  const handleId = uuidv4();
  const { handleSubmit, control } = useForm<Bot>({
    defaultValues: {
      _id: handleId,
      name: handleId,
      description: "",
      visibleFromBotProfile: true,
      systemPrompt: "",
      welcomeMessage: "",
      publiclyAccessible: true,
      suggestReplies: false,
      renderMarkdownContent: true,
      customTemperature: 0.7,
      enableCustomTemperature: false,
      maxTokens: 2048,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    mode: "onChange",
  });

  const onSubmit: SubmitHandler<Bot> = (data) => {
    console.log("bot", JSON.stringify(data, null, 2));
    if (!data.modelId) {
      alert("Please select a model");
      return;
    }
    const bot: Bot = {
      ...data,
      customTemperature: Number(data.customTemperature),
      maxTokens: Number(data.maxTokens),
      frequencyPenalty: Number(data.frequencyPenalty),
      presencePenalty: Number(data.presencePenalty),
      name: data._id,
    };
    createBot(bot);
  };

  const models = downloadedModels.map((model) => {
    return { title: model._id, value: model };
  });

  return (
    <form
      className="flex flex-col h-full w-full"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex mx-6 items-center justify-between gap-3 mt-3">
        <span className="text-gray-900 font-bold text-3xl">Create Bot</span>
        <div className="flex gap-3">
          <PrimaryButton isSubmit title="Create" />
        </div>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto scroll pt-4">
        <div className="flex flex-col max-w-2xl mx-auto gap-4">
          <Avatar />

          <TextInputWithTitle
            description="Handle should be unique, 4-20 characters long, and may include alphanumeric characters, dashes or underscores."
            title="Handle"
            id="_id"
            control={control}
            required={true}
          />

          <TextAreaWithTitle
            id="description"
            title="Bot description"
            placeholder="Optional"
            control={control}
          />

          <div className="flex flex-col gap-4 pb-2">
            <DropdownBox
              id="modelId"
              title="Model"
              data={models}
              control={control}
              required={true}
            />

            <CreateBotPromptInput
              id="systemPrompt"
              control={control}
              required
            />

            {/* <TextInputWithTitle
              description="The bot will send this message at the beginning of every conversation."
              title="Intro message"
              id="welcomeMessage"
              placeholder="Optional"
              control={control}
            /> */}

            <div className="flex flex-col gap-0.5">
              <label className="block text-base text-gray-900 font-bold">
                Bot access
              </label>
              <span className="text-sm pb-2 text-[#737d7d]">
                If this setting is enabled, the bot will be added to your
                profile and will be publicly accessible. Turning this off will
                make the bot private.
              </span>
              <ToggleSwitch
                id="publiclyAccessible"
                title="Bot publicly accessible"
                control={control}
              />
            </div>

            <CreateBotInAdvance control={control} />
          </div>
        </div>
      </div>
    </form>
  );
};

export default CreateBotContainer;
