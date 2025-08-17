import { Paper, Typography } from "@mui/material";
import { useRecoilState } from "recoil";
import { useEffect, useState } from "react";
import { productDescriptionAnswerState } from "./store/answerState";
import { Radio } from "@mui/material";
import styled from "@emotion/styled";

const AnswerArea = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  > div:nth-of-type(2) {
    display: flex;
    justify-content: center;
  }
`;

interface LocalAnswer {
  satisfaction: number;
  guilt: number;
  ownership: number;
  honesty: number;
}

const ProductDescriptionQuestion = () => {
  const [localAnswer, setLocalAnswer] = useState<LocalAnswer>({
    satisfaction: 0,
    guilt: 0,
    ownership: 0,
    honesty: 0
  });

  const [formAnswer, setFormAnswer] = useRecoilState(productDescriptionAnswerState);

  useEffect(() => {
    if (formAnswer) {
      setLocalAnswer({
        satisfaction: formAnswer.satisfaction || 0,
        guilt: formAnswer.guilt || 0,
        ownership: formAnswer.ownership || 0,
        honesty: formAnswer.honesty || 0
      });
    }
  }, []);

  const handleChange = (field: keyof LocalAnswer, value: number) => {
    setLocalAnswer((old) => {
      const newAnswer = { ...old, [field]: value };
      setFormAnswer((oldForm) => ({
        ...oldForm,
        ...newAnswer
      }));
      return newAnswer;
    });
  };

  const renderScaleQuestion = (question: string, field: keyof LocalAnswer) => {
    return (
      <Paper style={{ margin: "20px auto", padding: "20px", maxWidth: "800px" }}>
        <Typography variant="body1" gutterBottom>
          {question}
        </Typography>
        <AnswerArea>
          <div>まったくない</div>
          <div>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <Radio
                key={value}
                checked={localAnswer[field] === value}
                onChange={() => handleChange(field, value)}
                value={value}
                name={`${field}-${value}`}
                inputProps={{ "aria-label": value.toString() }}
              />
            ))}
          </div>
          <div>極めてある</div>
        </AnswerArea>
      </Paper>
    );
  };

  return (
    <>
      <Paper style={{ margin: "20px auto", padding: "20px", maxWidth: "800px" }}>
        <Typography variant="h5" gutterBottom>
          編集した商品説明文に関する評価
        </Typography>
        <Typography variant="body1" paragraph>
          以下の質問に10段階で回答してください。1は「まったくない」、10は「極めてある」を意味します。
        </Typography>
      </Paper>

      {renderScaleQuestion("文章作成に対する満足度はどのくらいですか", "satisfaction")}
      {renderScaleQuestion("出品者として、AIを活用して書いたことに対する罪悪感がありますか", "guilt")}
      {renderScaleQuestion("どのぐらい自分の文章だと思いますか", "ownership")}
      {renderScaleQuestion("完成した商品説明文は、どのぐらい正直に書いていると思いますか", "honesty")}
    </>
  );
};

export default ProductDescriptionQuestion;
