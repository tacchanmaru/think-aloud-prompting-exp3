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
  satisfaction: number | null;
  guilt: number | null;
  ownership: number | null;
  honesty: number | null;
  agency: number | null;
}

const ProductDescriptionQuestion = () => {
  const [localAnswer, setLocalAnswer] = useState<LocalAnswer>({
    satisfaction: null,
    guilt: null,
    ownership: null,
    honesty: null,
    agency: null
  });

  const [formAnswer, setFormAnswer] = useRecoilState(productDescriptionAnswerState);

  useEffect(() => {
    if (formAnswer) {
      setLocalAnswer({
        satisfaction: formAnswer.satisfaction || null,
        guilt: formAnswer.guilt || null,
        ownership: formAnswer.ownership || null,
        honesty: formAnswer.honesty || null,
        agency: formAnswer.agency || null
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
          <div>全く思わない</div>
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
          <div>非常にそう思う</div>
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
          以下の質問に10段階で回答してください。1は「全く思わない」、10は「非常にそう思う」を意味します。
        </Typography>
      </Paper>
      {renderScaleQuestion("この文章の編集時において、自分がどの程度主体的にコントロールしていると感じましたか", "agency")}
      {renderScaleQuestion("文章作成に対する満足度はどのくらいですか", "satisfaction")}
      {renderScaleQuestion("出品者として、AIを活用して書いたことに対する罪悪感がありますか", "guilt")}
      {renderScaleQuestion("どのぐらい自分の文章だと思いますか", "ownership")}
      {renderScaleQuestion("完成した商品説明文は、どのぐらい正直に書いていると思いますか", "honesty")}
    </>
  );
};

export default ProductDescriptionQuestion;
