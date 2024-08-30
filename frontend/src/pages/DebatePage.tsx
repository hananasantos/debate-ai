import React, { useState } from "react";
import { Layout, Typography, Button } from "antd";
import textToHtmlLinebreaks from "../util/newlines";

import { useNavigate } from "react-router-dom";
import LlmSider from "../components/LlmSider";
const { Header, Content, Footer, Sider } = Layout;

const leftSiderStyle: React.CSSProperties = {
  overflow: "auto",
  height: "100vh",
  position: "fixed",
  insetInlineStart: 0,
  top: 0,
  bottom: 0,
  scrollbarWidth: "thin",
  scrollbarColor: "unset",
};
const rightSiderStyle: React.CSSProperties = {
  overflow: "auto",
  height: "100vh",
  position: "fixed",
  insetInlineEnd: 0,
  top: 0,
  bottom: 0,
};

export default function DebatePage({ ws }: { ws: WebSocket }) {
  const navigate = useNavigate();
  const [debateHistory, setDebateHistory] = useState<
    { title: string; content: string }[]
  >([]);
  const [debateStream, setDebateStream] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [setupStatus, setSetupStatus] = useState("Loading");
  const [topic, setTopic] = useState("");
  const [llm1, setLlm1] = useState({ model: "", stance: "", personality: "" });
  const [llm2, setLlm2] = useState({ model: "", stance: "", personality: "" });
  console.log("HomePage");

  const wsOnSetup = (messageContent: any) => {
    const status = messageContent.status;
    if (status === 1) {
      setSetupStatus("Success");
      setLlm1({
        model: messageContent.llm1.model,
        stance: messageContent.llm1.stance,
        personality: messageContent.llm1.personality,
      });
      setLlm2({
        model: messageContent.llm2.model,
        stance: messageContent.llm2.stance,
        personality: messageContent.llm2.personality,
      });
      setTopic(messageContent.topic);
    } else {
      setSetupStatus("Failed");
    }
  };

  const wsOnStartStream = (messageContent: any) => {
    const debaterId = messageContent.debaterId;
    setDebateStream("");
    setStreaming(true);
    setDebateHistory((prev) => [
      ...prev,
      { title: `Debater ${debaterId}`, content: "" },
    ]);
  };

  const wsOnAnswerStream = (messageContent: string) => {
    const message = messageContent;
    // console.log(message);
    setDebateStream((prev) => prev + message);
  };

  const wsOnEndStream = (messageContent: any) => {
    // const debaterId = messageContent.debaterId;
    setDebateHistory((prev) => {
      const newHistory = [...prev];
      if (newHistory.length > 0) {
        newHistory[newHistory.length - 1].content = debateStream;
      }
      return newHistory;
    });
    setStreaming(false);
  };

  const wsOnStartDebate = (message: string) => {
    const newMessage = { title: "Moderator", content: message };
    setDebateHistory((prev) => [...prev, newMessage]);
  };
  const wsOnModerator = (message: string) => {
    const newMessage = { title: "Moderator", content: message };
    setDebateHistory((prev) => [...prev, newMessage]);
  };

  // TODO: stream chunks are undefined
  // TODO: add empty message to debate history
  // TODO: when streaming is done, add that debater's message to new debate history
  ws.onmessage = (message: MessageEvent) => {
    const messageObject = JSON.parse(message.data);
    const messageType = messageObject.type;
    console.log(messageObject);
    if (messageType === "setup") {
      wsOnSetup(messageObject.content);
    } else if (messageType === "startStream") {
      wsOnStartStream(messageObject.content);
    } else if (messageType === "answerStream") {
      wsOnAnswerStream(messageObject.content);
    } else if (messageType === "endStream") {
      wsOnEndStream(messageObject.content);
    } else if (messageType === "startDebate") {
      wsOnStartDebate(messageObject.content);
    } else if (messageType === "moderator") {
      wsOnModerator(messageObject.content);
    }
  };

  const handleStartDebate = () => {
    ws.send(JSON.stringify({ type: "start", content: { topic } }));
  };
  const handleNextDebateMessage = () => {
    ws.send(JSON.stringify({ type: "next", content: {} }));
  };
  //TODO ADD STARTING MOD MESSAGE
  return (
    <Layout>
      <Header
        style={{
          background: "linear-gradient(45deg, #414535, #8D9575)",
          height: "auto",
          maxHeight: "170px",
          overflow: "scroll",
          paddingBottom: "10px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "fixed",
          width: "100vw",
          zIndex: 50,
        }}
      >
        <Typography.Title level={1} style={{ color: "white" }}>
          Debate
        </Typography.Title>
        <Typography.Title level={4} style={{ color: "white", margin: "10px" }}>
          {topic}
        </Typography.Title>
      </Header>

      <Layout hasSider>
        <Sider
          width={300}
          style={{
            background: "#E2E5DC",
            height: "100vh",
            position: "fixed",
            paddingTop: "200px", // account for header
          }}
        >
          <LlmSider position="left" content={llm1} />
        </Sider>
        <Layout>
          <Content
            style={{
              height: "auto",
              minHeight: "100vh",
              marginTop: "200px", // account for header
              marginLeft: "320px", // account for siders
              marginRight: "320px",
              zIndex: 0,
            }}
          >
            {debateStream === "" && (
              <Typography>{"Setup status: " + setupStatus}</Typography>
            )}
            {setupStatus === "Success" &&
              debateHistory.map((message, index) => (
                <div key={index}>
                  <Typography.Title level={2}>{message.title}</Typography.Title>
                  <Typography>
                    {textToHtmlLinebreaks(message.content)}
                  </Typography>
                </div>
              ))}
            {setupStatus === "Success" && debateHistory.length === 0 && (
              <Button
                type="primary"
                onClick={handleStartDebate}
                style={{ background: "#8D9575" }}
              >
                Start Debate
              </Button>
            )}
            {streaming === true && (
              <Typography>{textToHtmlLinebreaks(debateStream)}</Typography>
            )}
            {setupStatus === "Success" &&
              debateHistory.length > 0 &&
              !streaming && (
                <Button
                  type="primary"
                  onClick={handleNextDebateMessage}
                  style={{ background: "#8D9575" }}
                >
                  Next Debater
                </Button>
              )}
          </Content>
        </Layout>
        <Sider
          width={300}
          style={{
            background: "#E2E5DC",
            height: "100vh",
            position: "fixed",
            insetInlineEnd: 0,
            paddingTop: "200px", // account for header
          }}
        >
          <LlmSider position="right" content={llm2} />
        </Sider>
      </Layout>
      <Footer style={{ textAlign: "center" }}>
        Powered by OpenAI and Anthropic
      </Footer>
    </Layout>
  );
}
