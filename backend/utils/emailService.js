const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

function getFromEmail() {
  return (
    process.env.RESEND_FROM ||
    process.env.MAIL_FROM ||
    "onboarding@resend.dev"
  );
}

// =====================================================
// SEND EMAIL USING RESEND
// =====================================================

async function sendEmail({ to, subject, text, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured.");
    throw new Error("Email service is not configured");
  }

  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to: [to],
    subject,
    text,
    html,
  });

  if (error) {
    console.error("Resend email failed:", error);
    throw new Error(error.message || "Failed to send email");
  }

  console.log(`Email sent successfully to ${to}. ID: ${data.id}`);

  return true;
}

// =====================================================
// SEND BUDGET ALERT EMAIL
// =====================================================

async function sendBudgetAlertEmail({
  to,
  name,
  category,
  level,
  percentUsed,
  spent,
  limit,
}) {
  const exceeded = level === "exceeded";

  const subject = exceeded
    ? `ExpenseAI: ${category} budget exceeded`
    : `ExpenseAI: ${category} budget alert`;

  const budgetAmount = Number(limit || 0);
  const spentAmount = Number(spent || 0);

  const remaining = Math.max(
    budgetAmount - spentAmount,
    0
  );

  const formattedBudget =
    budgetAmount.toLocaleString("en-IN");

  const formattedSpent =
    spentAmount.toLocaleString("en-IN");

  const formattedRemaining =
    remaining.toLocaleString("en-IN");

  const userName = name || "there";

  const dashboardUrl =
    process.env.CLIENT_URL ||
    "http://localhost:5173";

  const text = [
    `Hi ${userName},`,
    "",
    exceeded
      ? `Your ${category} budget has been exceeded.`
      : `Your ${category} budget has reached ${percentUsed}%.`,
    "",
    `Category: ${category}`,
    `Budget: ₹${formattedBudget}`,
    `Spent: ₹${formattedSpent}`,
    `Remaining: ₹${formattedRemaining}`,
    `Usage: ${percentUsed}%`,
    "",
    "Review your recent expenses in ExpenseAI.",
    "",
    `Open Dashboard: ${dashboardUrl}`,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>ExpenseAI Budget Alert</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f5f7fb;
  font-family:Arial,Helvetica,sans-serif;
  color:#172033;
">

  <div style="
    margin:0;
    padding:35px 15px;
    background:#f5f7fb;
  ">

    <div style="
      max-width:600px;
      margin:0 auto;
      background:#ffffff;
      border:1px solid #e6e9f0;
      border-radius:18px;
      overflow:hidden;
    ">

      <div style="
        padding:28px 30px;
        background:linear-gradient(135deg,#24283f,#5557dd);
        color:#ffffff;
      ">

        <div style="
          font-size:13px;
          font-weight:700;
          letter-spacing:2px;
        ">
          EXPENSEAI
        </div>

        <h1 style="
          margin:10px 0 0;
          font-size:24px;
          line-height:1.3;
        ">
          ${
            exceeded
              ? "Budget Exceeded 🚨"
              : "Budget Alert ⚠️"
          }
        </h1>

      </div>

      <div style="padding:30px;">

        <p style="
          margin:0 0 14px;
          font-size:16px;
          color:#172033;
        ">
          Hi <strong>${userName}</strong>,
        </p>

        <p style="
          margin:0;
          font-size:14px;
          line-height:1.7;
          color:#667085;
        ">
          ${
            exceeded
              ? `Your <strong>${category}</strong> budget has been exceeded.`
              : `Your <strong>${category}</strong> budget has reached <strong>${percentUsed}%</strong>.`
          }
        </p>

        <div style="
          margin:25px 0;
          padding:20px;
          border-radius:14px;
          background:#f7f8fc;
        ">

          <table style="
            width:100%;
            border-collapse:collapse;
            font-size:14px;
          ">

            <tr>
              <td style="padding:8px 0;color:#7b8498;">
                Category
              </td>
              <td style="
                padding:8px 0;
                text-align:right;
                font-weight:700;
                color:#172033;
              ">
                ${category}
              </td>
            </tr>

            <tr>
              <td style="padding:8px 0;color:#7b8498;">
                Budget
              </td>
              <td style="
                padding:8px 0;
                text-align:right;
                font-weight:700;
                color:#172033;
              ">
                ₹${formattedBudget}
              </td>
            </tr>

            <tr>
              <td style="padding:8px 0;color:#7b8498;">
                Spent
              </td>
              <td style="
                padding:8px 0;
                text-align:right;
                font-weight:700;
                color:#172033;
              ">
                ₹${formattedSpent}
              </td>
            </tr>

            <tr>
              <td style="padding:8px 0;color:#7b8498;">
                Remaining
              </td>
              <td style="
                padding:8px 0;
                text-align:right;
                font-weight:700;
                color:#172033;
              ">
                ₹${formattedRemaining}
              </td>
            </tr>

            <tr>
              <td style="padding:8px 0;color:#7b8498;">
                Usage
              </td>
              <td style="
                padding:8px 0;
                text-align:right;
                font-weight:700;
                color:#5557dd;
              ">
                ${percentUsed}%
              </td>
            </tr>

          </table>
        </div>

        <p style="
          margin:0;
          font-size:14px;
          line-height:1.7;
          color:#667085;
        ">
          Review your recent expenses in
          <strong>ExpenseAI</strong>
          and adjust your spending if needed.
        </p>

        <div style="
          text-align:center;
          margin:30px 0 10px;
        ">

          <a
            href="${dashboardUrl}"
            target="_blank"
            style="
              display:inline-block;
              padding:14px 26px;
              background:#5557dd;
              color:#ffffff;
              text-decoration:none;
              border-radius:10px;
              font-size:14px;
              font-weight:700;
            "
          >
            View Dashboard →
          </a>

        </div>

        <p style="
          margin:18px 0 0;
          text-align:center;
          font-size:11px;
          line-height:1.5;
          color:#98a2b3;
          word-break:break-all;
        ">
          If the button doesn't work, open:
          <br />
          ${dashboardUrl}
        </p>

        <div style="
          margin-top:28px;
          padding-top:20px;
          border-top:1px solid #e6e9f0;
          text-align:center;
          font-size:12px;
          color:#98a2b3;
        ">
          This is an automated notification from ExpenseAI.
        </div>

      </div>
    </div>
  </div>

</body>
</html>
`;

  return sendEmail({
    to,
    subject,
    text,
    html,
  });
}

// =====================================================
// SEND PASSWORD RESET EMAIL
// =====================================================

async function sendPasswordResetEmail({
  to,
  name,
  resetToken,
}) {
  const frontendUrl =
    process.env.CLIENT_URL ||
    "http://localhost:5173";

  const resetUrl =
    `${frontendUrl}/reset-password/${resetToken}`;

  const userName = name || "there";

  const subject =
    "ExpenseAI: Reset your password";

  const text = [
    `Hi ${userName},`,
    "",
    "We received a request to reset your ExpenseAI password.",
    "",
    "Use the link below to create a new password:",
    resetUrl,
    "",
    "This link will expire in 15 minutes.",
    "",
    "If you did not request a password reset, you can safely ignore this email.",
    "",
    "ExpenseAI",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Reset your ExpenseAI password</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f5f7fb;
  font-family:Arial,Helvetica,sans-serif;
  color:#172033;
">

  <div style="
    padding:35px 15px;
    background:#f5f7fb;
  ">

    <div style="
      max-width:600px;
      margin:0 auto;
      background:#ffffff;
      border:1px solid #e6e9f0;
      border-radius:18px;
      overflow:hidden;
    ">

      <div style="
        padding:28px 30px;
        background:linear-gradient(135deg,#24283f,#5557dd);
        color:#ffffff;
      ">

        <div style="
          font-size:13px;
          font-weight:700;
          letter-spacing:2px;
        ">
          EXPENSEAI
        </div>

        <h1 style="
          margin:10px 0 0;
          font-size:24px;
        ">
          Reset your password
        </h1>

      </div>

      <div style="padding:30px;">

        <p style="font-size:16px;">
          Hi <strong>${userName}</strong>,
        </p>

        <p style="
          font-size:14px;
          line-height:1.7;
          color:#667085;
        ">
          We received a request to reset your ExpenseAI password.
          Click the button below to create a new password.
        </p>

        <div style="
          text-align:center;
          margin:30px 0;
        ">

          <a
            href="${resetUrl}"
            target="_blank"
            style="
              display:inline-block;
              padding:14px 26px;
              background:#5557dd;
              color:#ffffff;
              text-decoration:none;
              border-radius:10px;
              font-size:14px;
              font-weight:700;
            "
          >
            Reset Password →
          </a>

        </div>

        <p style="
          font-size:13px;
          line-height:1.6;
          color:#667085;
        ">
          This password reset link will expire in
          <strong>15 minutes</strong>.
        </p>

        <p style="
          font-size:13px;
          line-height:1.6;
          color:#667085;
        ">
          If you did not request this password reset,
          you can safely ignore this email.
        </p>

        <div style="
          margin-top:28px;
          padding-top:20px;
          border-top:1px solid #e6e9f0;
          text-align:center;
          font-size:12px;
          color:#98a2b3;
        ">
          This is an automated email from ExpenseAI.
        </div>

      </div>
    </div>
  </div>

</body>
</html>
`;

  return sendEmail({
    to,
    subject,
    text,
    html,
  });
}

module.exports = {
  sendBudgetAlertEmail,
  sendPasswordResetEmail,
};