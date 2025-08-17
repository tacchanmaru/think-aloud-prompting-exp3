import { Paper, Typography } from "@mui/material";
import SUSQuestion from "./SUSQuestion";
import NasaTLXQuestion from "./NasaTLXQuestion";
import ProductDescriptionQuestion from "./ProductDescriptionQuestion";
import { nasa_tlx_list, sus_list } from "./constraints";

const PostTaskQuestion = () => {
  return (
    <>
      <Paper
        style={{ margin: "20px auto", padding: "20px", maxWidth: "800px" }}
      >
        <Typography variant="h5" gutterBottom>
          タスク後のアンケート
        </Typography>
      </Paper>

      <Paper
        style={{ margin: "20px auto", padding: "20px", maxWidth: "800px" }}
      >
        <Typography variant="h6" gutterBottom>
          システム使用性評価（SUS）
        </Typography>
        <Typography variant="body1" paragraph>
          実験中に使用したツールについて以下の質問に回答してください。長時間考えることはせず、各質問文を読んでその場で思ったことを回答してください。
        </Typography>
        {sus_list.map((sus) => {
          return (
            <Paper
              style={{
                margin: "20px auto",
                padding: "20px",
                maxWidth: "800px",
              }}
              key={sus.id}
            >
              <SUSQuestion {...sus} />
            </Paper>
          );
        })}
      </Paper>

      <Paper
        style={{ margin: "20px auto", padding: "20px", maxWidth: "800px" }}
      >
        <Typography variant="h6" gutterBottom>
          商品説明文に関する質問
        </Typography>
        <ProductDescriptionQuestion />
      </Paper>

      <Paper
        style={{ margin: "20px auto", padding: "20px", maxWidth: "800px" }}
      >
        <Typography variant="h6" gutterBottom>
          タスク負荷評価（NASA-TLX）
        </Typography>
        <div>
          赤い線を動かして、以下の質問に回答してください。
          <br />
          クリックすると赤い線が現れます。
          ドラッグで赤い線を動かすことも可能です。
        </div>
        <NasaTLXQuestion
          id={-1}
          name="記入例"
          description=""
          min="小さい"
          max="大きい"
        />
        {nasa_tlx_list.map((nasa_tlx) => {
          return (
            <Paper
              style={{
                margin: "20px auto",
                padding: "20px",
                maxWidth: "800px",
              }}
              key={nasa_tlx.id}
            >
              <NasaTLXQuestion {...nasa_tlx} />
            </Paper>
          );
        })}
      </Paper>
    </>
  );
};

export default PostTaskQuestion;
