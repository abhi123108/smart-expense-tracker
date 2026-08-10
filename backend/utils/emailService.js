const nodemailer = require("nodemailer");

let transporter = null;

// =====================================================
// CREATE / GET MAIL TRANSPORTER
// =====================================================

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // SMTP configuration missing
  if (!host || !user || !pass) {
    console.warn(
      "📧 Budget email skipped: SMTP settings are not configured."
    );

    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",

    auth: {
      user,
      pass,
    },
  });

  return transporter;
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
  const mailer = getTransporter();

  if (!mailer) {
    return false;
  }

  // ===================================================
  // ALERT TYPE
  // ===================================================

  const exceeded = level === "exceeded";

  const subject = exceeded
    ? `🚨 ExpenseAI: ${category} budget exceeded`
    : `⚠️ ExpenseAI: ${category} budget alert`;

  // ===================================================
  // NUMBERS
  // ===================================================

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

  // ===================================================
  // DASHBOARD URL
  // ===================================================

  const dashboardUrl =
    process.env.CLIENT_URL ||
    "http://localhost:5173";

  // ===================================================
  // PLAIN TEXT EMAIL
  // ===================================================

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

  // ===================================================
  // HTML EMAIL
  // ===================================================

  const html = `
<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>
    ExpenseAI Budget Alert
  </title>

</head>


<body
  style="
    margin:0;
    padding:0;
    background:#f5f7fb;
    font-family:Arial,Helvetica,sans-serif;
    color:#172033;
  "
>

  <!-- OUTER CONTAINER -->

  <div
    style="
      margin:0;
      padding:35px 15px;
      background:#f5f7fb;
    "
  >

    <!-- EMAIL CARD -->

    <div
      style="
        max-width:600px;
        margin:0 auto;
        background:#ffffff;
        border:1px solid #e6e9f0;
        border-radius:18px;
        overflow:hidden;
      "
    >

      <!-- ==========================================
           HEADER
      =========================================== -->

      <div
        style="
          padding:28px 30px;
          background:linear-gradient(
            135deg,
            #24283f,
            #5557dd
          );
          color:#ffffff;
        "
      >

        <div
          style="
            font-size:13px;
            font-weight:700;
            letter-spacing:2px;
          "
        >
          EXPENSEAI
        </div>


        <h1
          style="
            margin:10px 0 0;
            font-size:24px;
            line-height:1.3;
          "
        >
          ${
            exceeded
              ? "Budget Exceeded 🚨"
              : "Budget Alert ⚠️"
          }
        </h1>

      </div>


      <!-- ==========================================
           CONTENT
      =========================================== -->

      <div
        style="
          padding:30px;
        "
      >

        <!-- GREETING -->

        <p
          style="
            margin:0 0 14px;
            font-size:16px;
            color:#172033;
          "
        >
          Hi
          <strong>${userName}</strong>,
        </p>


        <!-- MESSAGE -->

        <p
          style="
            margin:0;
            font-size:14px;
            line-height:1.7;
            color:#667085;
          "
        >

          ${
            exceeded
              ? `Your <strong>${category}</strong> budget has been exceeded.`
              : `Your <strong>${category}</strong> budget has reached <strong>${percentUsed}%</strong>.`
          }

        </p>


        <!-- ==========================================
             SUMMARY CARD
        =========================================== -->

        <div
          style="
            margin:25px 0;
            padding:20px;
            border-radius:14px;
            background:#f7f8fc;
          "
        >

          <table
            style="
              width:100%;
              border-collapse:collapse;
              font-size:14px;
            "
          >

            <!-- CATEGORY -->

            <tr>

              <td
                style="
                  padding:8px 0;
                  color:#7b8498;
                "
              >
                Category
              </td>

              <td
                style="
                  padding:8px 0;
                  text-align:right;
                  font-weight:700;
                  color:#172033;
                "
              >
                ${category}
              </td>

            </tr>


            <!-- BUDGET -->

            <tr>

              <td
                style="
                  padding:8px 0;
                  color:#7b8498;
                "
              >
                Budget
              </td>

              <td
                style="
                  padding:8px 0;
                  text-align:right;
                  font-weight:700;
                  color:#172033;
                "
              >
                ₹${formattedBudget}
              </td>

            </tr>


            <!-- SPENT -->

            <tr>

              <td
                style="
                  padding:8px 0;
                  color:#7b8498;
                "
              >
                Spent
              </td>

              <td
                style="
                  padding:8px 0;
                  text-align:right;
                  font-weight:700;
                  color:#172033;
                "
              >
                ₹${formattedSpent}
              </td>

            </tr>


            <!-- REMAINING -->

            <tr>

              <td
                style="
                  padding:8px 0;
                  color:#7b8498;
                "
              >
                Remaining
              </td>

              <td
                style="
                  padding:8px 0;
                  text-align:right;
                  font-weight:700;
                  color:#172033;
                "
              >
                ₹${formattedRemaining}
              </td>

            </tr>


            <!-- USAGE -->

            <tr>

              <td
                style="
                  padding:8px 0;
                  color:#7b8498;
                "
              >
                Usage
              </td>

              <td
                style="
                  padding:8px 0;
                  text-align:right;
                  font-weight:700;
                  color:#5557dd;
                "
              >
                ${percentUsed}%
              </td>

            </tr>

          </table>

        </div>


        <!-- ==========================================
             DESCRIPTION
        =========================================== -->

        <p
          style="
            margin:0;
            font-size:14px;
            line-height:1.7;
            color:#667085;
          "
        >
          Review your recent expenses in
          <strong>ExpenseAI</strong>
          and adjust your spending if needed.
        </p>


        <!-- ==========================================
             DASHBOARD BUTTON
        =========================================== -->

        <div
          style="
            text-align:center;
            margin:30px 0 10px;
          "
        >

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


        <!-- FALLBACK URL -->

        <p
          style="
            margin:18px 0 0;
            text-align:center;
            font-size:11px;
            line-height:1.5;
            color:#98a2b3;
            word-break:break-all;
          "
        >
          If the button doesn't work, open:
          <br />

          ${dashboardUrl}

        </p>


        <!-- ==========================================
             FOOTER
        =========================================== -->

        <div
          style="
            margin-top:28px;
            padding-top:20px;
            border-top:1px solid #e6e9f0;
            text-align:center;
            font-size:12px;
            color:#98a2b3;
          "
        >

          This is an automated notification
          from ExpenseAI.

        </div>

      </div>

    </div>

  </div>

</body>

</html>
`;

  // ===================================================
  // SEND
  // ===================================================

  await mailer.sendMail({
    from:
      process.env.MAIL_FROM ||
      process.env.SMTP_USER,

    to,

    subject,

    text,

    html,
  });

  console.log(
    `📧 Budget alert email sent to ${to}`
  );

  return true;
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  sendBudgetAlertEmail,
};