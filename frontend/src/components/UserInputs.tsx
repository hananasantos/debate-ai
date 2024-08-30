import React, { useState } from "react";
import { Button, Typography, Input, Select } from "antd";
const { TextArea } = Input;

interface TopicInputProps {
  onChange: (value: string) => void;
}

export function TopicInput({ onChange }: TopicInputProps) {
  return (
    <>
      <Typography.Title level={3}>Topic</Typography.Title>
      <TextArea
        rows={3}
        defaultValue="Should pineapple on pizza be allowed?"
        size="large"
        placeholder="large size"
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "30%", margin: "10px" }}
      />
    </>
  );
}

interface LlmInputProps {
  changeModel: (value: string) => void;
  changeStance: (value: string) => void;
  changePersonality: (value: string) => void;
  index: number;
}

export function LlmInput({
  changeModel,
  changeStance,
  changePersonality,
  index,
}: LlmInputProps) {
  const handleModelChange = (value: string) => {
    if (["gpt", "claude", "gemini"].includes(value)) {
      changeModel(value);
    } else {
      changeModel("gpt");
    }
  };
  return (
    <>
      <Typography.Title level={3}>LLM {index}</Typography.Title>
      <Typography.Title level={5}>Model</Typography.Title>
      <Select
        defaultValue={index === 1 ? "gpt" : "claude"}
        options={[
          { label: "gpt", value: "gpt" },
          {
            label: "claude",
            value: "claude",
          },
          {
            lable: "gemini",
            value: "gemini",
          },
        ]}
        style={{ width: "20%" }}
        onChange={handleModelChange}
      />
      <Typography.Title level={5}>Stance</Typography.Title>
      <Input
        defaultValue={index === 1 ? "Pro" : "Con"}
        size="large"
        placeholder="large size"
        onChange={(e) => changeStance(e.target.value)}
        style={{ width: "30%" }}
      />
      <Typography.Title level={5}>Personality</Typography.Title>
      <TextArea
        rows={4}
        defaultValue={index === 1 ? "Snarky" : "Humorous"}
        placeholder="Personality"
        onChange={(e) => changePersonality(e.target.value)}
        style={{ width: "30%" }}
      />
    </>
  );
}
