import { Paper, Typography } from "@mui/material";

interface AdminConfirmationProps {
  taskNumber: number;
}

const AdminConfirmation = ({ taskNumber }: AdminConfirmationProps) => {
  return (
    <Paper style={{ margin: "20px auto", padding: "40px", maxWidth: "800px", textAlign: "center" }}>
      <Typography variant="h5" gutterBottom>
        質問紙{taskNumber}は終わりです
      </Typography>
      <Typography variant="body1" style={{ marginTop: "20px" }}>
        実験監督者にお伝えください
      </Typography>
    </Paper>
  );
};

export default AdminConfirmation;