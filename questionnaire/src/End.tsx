import { Divider, Paper } from "@mui/material";
import styled from "@emotion/styled";
import { sub_color } from "./color";
import { useEffect } from "react";

const Container = styled.div`
  min-height: 100vh;
  padding: 10vh 10vw;
  background-color: ${sub_color};
`;

function End() {
  useEffect(() => {
    localStorage.setItem("page", "0");
    sessionStorage.clear();
  }, []);

  return (
    <Container>
      <Paper
        elevation={3}
        style={{
          margin: "20px auto",
          padding: "10px",
          maxWidth: "800px",
        }}
      >
        アンケート
      </Paper>
      <Divider />
      <Paper
        style={{
          margin: "20px auto",
          padding: "10px",
          maxWidth: "800px",
        }}
      >
        回答終了です。ありがとうございます。
      </Paper>
    </Container>
  );
}

export default End;
