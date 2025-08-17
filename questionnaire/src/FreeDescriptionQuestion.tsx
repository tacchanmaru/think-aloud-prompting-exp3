import { Paper, TextField, Typography } from "@mui/material";
import { useRecoilState } from "recoil";
import { useEffect, useState } from "react";
import { ProductDescriptionState, productDescriptionAnswerState } from "./store/answerState";

const FreeDescriptionQuestion = () => {
  const [answer, setAnswer] = useState("");
  const [formAnswer, setFormAnswer] = useRecoilState(productDescriptionAnswerState);

  useEffect(() => {
    if (formAnswer && formAnswer.freeText) {
      setAnswer(formAnswer.freeText);
    }
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setAnswer(value);
    setFormAnswer((old: ProductDescriptionState) => ({
      ...old,
      freeText: value
    }));
  };

  return (
    <Paper
      style={{ margin: "20px auto", padding: "20px", maxWidth: "800px" }}
    >
      <Typography variant="body1" paragraph>
        その他感じたことを自由に記述してください。
      </Typography>
      <TextField
        multiline
        rows={8}
        fullWidth
        variant="outlined"
        value={answer}
        onChange={handleChange}
      />
    </Paper>
  );
};

export default FreeDescriptionQuestion; 