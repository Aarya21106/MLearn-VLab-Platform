import fs from "node:fs";
import path from "node:path";

const DATASETS_DIR = path.join(__dirname, "..", "public", "datasets");

/** Renders the header + first `rows` data rows of a bundled CSV as a markdown table. */
function csvPreviewMd(filename: string, rows = 5): string {
  const raw = fs.readFileSync(path.join(DATASETS_DIR, filename), "utf-8").trim();
  const lines = raw.split("\n");
  const header = lines[0].split(",");
  const body = lines.slice(1, 1 + rows).map((l) => l.split(","));

  const headerRow = `| ${header.join(" | ")} |`;
  const sepRow = `| ${header.map(() => "---").join(" | ")} |`;
  const bodyRows = body.map((r) => `| ${r.join(" | ")} |`).join("\n");

  return `${headerRow}\n${sepRow}\n${bodyRows}`;
}

const AUTOGRADER_PREAMBLE = `
_checks = []
_score = 0

def _check(fn, label, points):
    global _score
    try:
        ok = bool(fn())
    except Exception:
        ok = False
    _checks.append((label, ok))
    if ok:
        _score += points
    return ok
`.trimStart();

function finalizeResult() {
  return `
passed_checks = [label for label, ok in _checks if ok]
failed_checks = [label for label, ok in _checks if not ok]
RESULT = {
    "score": min(100, _score),
    "passed_checks": passed_checks,
    "failed_checks": failed_checks,
    "message": f"{len(passed_checks)}/{len(_checks)} checks passed",
}
`.trimStart();
}

export type ExperimentSeed = {
  orderIndex: number;
  title: string;
  syllabusUnit: string;
  questionMd: string;
  manualMd: string;
  hintsMd: string;
  starterCode: string;
  datasetUrl: string | null;
  datasetPreviewMd: string | null;
  autograderCode: string;
  maxScore: number;
  estMinutes: number;
};

export const experiments: ExperimentSeed[] = [];

// ---------------------------------------------------------------------------
// 1. Data Import & Exploration (Unit 1)
// ---------------------------------------------------------------------------
experiments.push({
  orderIndex: 1,
  title: "Data Import & Exploration",
  syllabusUnit: "Unit 1 - Introduction",
  questionMd: `You've just joined the analytics team at a university training office. Before anyone
can build a model on the *Student Performance* records, someone has to answer the boring
but essential question: **what does this dataset actually look like?**

You're handed \`data.csv\` - 300 students, tracked on study habits, attendance, and
outcomes - with no documentation. Your job in this first experiment is purely
exploratory: load it, inspect its shape, check what each column contains, and get a feel
for the data before anyone trusts it enough to model.`,
  manualMd: `## Why exploration comes first

Every ML pipeline starts the same way: before you fit a single model, you need to know
what you're working with. Skipping this step is how people end up fitting a regression
on a column that's secretly text, or training on a dataset with 40% missing values they
never noticed.

## The pandas DataFrame

pandas represents tabular data as a **DataFrame** - rows are observations, columns are
variables, much like a spreadsheet but with proper types per column. You load a CSV
into one with:

\`\`\`python
import pandas as pd
df = pd.read_csv("data.csv")
\`\`\`

In MLEARN, the experiment's dataset is already loaded into the notebook's filesystem as
\`data.csv\`, so \`pd.read_csv("data.csv")\` always works without needing a file upload.

## How to explore a new DataFrame

1. **Shape** - \`df.shape\` returns \`(num_rows, num_cols)\`. It's the first sanity check:
   does the row count match what you were told to expect?
2. **First rows** - \`df.head()\` shows the first 5 rows by default. It's how you catch
   obviously wrong data (like a column that's all zeros) at a glance.
3. **Data types** - \`df.dtypes\` lists each column's inferred type (\`int64\`, \`float64\`,
   \`object\` for strings, etc.). A numeric column that shows up as \`object\` usually means
   there's a stray non-numeric value (like a typo or a missing-value marker) somewhere in it.
4. **Summary statistics** - \`df.describe()\` gives count, mean, std, min, max, and
   quartiles for every numeric column in one call - a fast way to spot outliers or
   impossible values (like a negative age).

## Your task

Load \`data.csv\` into a DataFrame called \`df\`. Then, using the starter code as a guide,
compute and print:
- the shape of \`df\`
- the first 5 rows
- the dtype of every column

The autograder checks the shape and columns of \`df\` directly, so the important part is
getting \`df\` itself right - the print statements are for your own understanding.`,
  hintsMd: `**Hint 1.** \`pd.read_csv("data.csv")\` is all you need to load the file - the dataset
is already sitting in the notebook's filesystem under that exact name.

**Hint 2.** \`df.shape\` is a tuple, not a function call - no parentheses after it. If you
want the row and column counts separately: \`num_rows, num_cols = df.shape\`.

**Hint 3.** \`df.head()\` and \`df.head(10)\` both work - the argument controls how many rows
you see, defaulting to 5.

**Hint 4.** If \`df.dtypes\` shows \`object\` for a column you expected to be numeric, that's
usually a sign of a bad value in the raw data - worth investigating with
\`df["column_name"].unique()\`.`,
  starterCode: `import pandas as pd

# The dataset is already loaded into the notebook's filesystem as "data.csv"
df = pd.read_csv("data.csv")

# TODO: inspect the shape, first rows, and dtypes of df
num_rows, num_cols = df.shape
print("Shape:", df.shape)

print("\\nFirst 5 rows:")
print(df.head())

print("\\nColumn types:")
print(df.dtypes)
`,
  datasetUrl: "/datasets/students_performance.csv",
  datasetPreviewMd: csvPreviewMd("students_performance.csv"),
  autograderCode:
    AUTOGRADER_PREAMBLE +
    `
_check(lambda: isinstance(df, pd.DataFrame), "df is a pandas DataFrame", 25)
_check(lambda: df.shape[0] == 300, "df has 300 rows", 20)
_check(lambda: df.shape[1] == 6, "df has 6 columns", 15)

_expected_cols = {"student_id", "study_hours", "attendance_pct", "sleep_hours", "previous_score", "final_score"}
_check(lambda: _expected_cols.issubset(set(df.columns)), "df has the expected columns", 25)
_check(lambda: str(df["final_score"].dtype).startswith(("float", "int")), "final_score column is numeric", 15)
` + finalizeResult(),
  maxScore: 100,
  estMinutes: 30,
});

// ---------------------------------------------------------------------------
// 2. Descriptive Statistics & Probability Basics (Unit 1)
// ---------------------------------------------------------------------------
experiments.push({
  orderIndex: 2,
  title: "Descriptive Statistics & Probability Basics",
  syllabusUnit: "Unit 1 - Introduction",
  questionMd: `The exam office has handed you five subjects' worth of scores and wants two things
before the semester report goes out: a statistical summary of how students performed
overall, and a simple probability estimate - **if a student is picked at random, what's
the chance they passed?**

You have \`data.csv\` with 300 exam records across 5 subjects. Compute the core descriptive
statistics for the \`score\` column, then estimate the probability of passing directly
from the data using simple relative frequency.`,
  manualMd: `## Descriptive statistics

Before any inferential claim, you summarize. The core numbers for a numeric column are:

- **Mean** (\`df["score"].mean()\`) - the arithmetic average, sensitive to outliers.
- **Variance** and **standard deviation** (\`df["score"].var()\`, \`df["score"].std()\`) -
  how spread out the values are around the mean. Std is variance's square root, so it's
  in the same units as the original data (easier to interpret than variance).
- **Quantiles** (\`df["score"].quantile(0.25)\`, etc.) - values below which a given
  fraction of the data falls. The 50th percentile is the median.

pandas gives you all of these individually, or in one shot via \`df["score"].describe()\`.

## Probability from data

The simplest way to estimate a probability from an observed dataset is the **relative
frequency**: count how many times an event happened, divide by the total number of
trials.

$$P(\\text{Pass}) \\approx \\frac{\\text{number of passing students}}{\\text{total students}}$$

In pandas, if \`result\` is a column of \`"Pass"\`/\`"Fail"\` strings, this is one line:

\`\`\`python
p_pass = (df["result"] == "Pass").mean()
\`\`\`

That works because \`(df["result"] == "Pass")\` produces a column of \`True\`/\`False\`
values, and \`.mean()\` on a boolean column is exactly the fraction that are \`True\` -
which is the relative-frequency estimate of the probability.

## Your task

Using \`data.csv\`, compute and store these exact variable names:

- \`mean_score\`, \`variance_score\`, \`std_score\` - for the \`score\` column
- \`q1\`, \`median_score\`, \`q3\` - the 25th/50th/75th percentiles of \`score\`
- \`p_pass\` - the probability that a randomly chosen student passed (\`result == "Pass"\`)

The autograder recomputes each of these independently from the same dataset and checks
your values against them within a small tolerance, so precision matters more than the
exact method you use to get there.`,
  hintsMd: `**Hint 1.** All five stats have direct pandas methods: \`.mean()\`, \`.var()\`, \`.std()\`,
\`.quantile(q)\`, and \`.median()\` (equivalent to \`.quantile(0.5)\`).

**Hint 2.** By default, \`pandas.Series.var()\` and \`.std()\` use the *sample* variance
(dividing by n-1), which is what the autograder expects - don't pass \`ddof=0\`.

**Hint 3.** For \`p_pass\`, you don't need a loop or an \`if\` statement - comparing a
column to a value gives you a boolean Series, and \`.mean()\` on that directly gives the
proportion that's \`True\`.

**Hint 4.** Double check you're filtering/aggregating the \`score\` column specifically,
not accidentally computing statistics across the whole DataFrame.`,
  starterCode: `import pandas as pd

df = pd.read_csv("data.csv")

# TODO: compute descriptive statistics for the "score" column
# (mean, sample variance, sample std, 25th/50th/75th percentiles)
mean_score = None
variance_score = None
std_score = None

q1 = None
median_score = None
q3 = None

# TODO: estimate P(Pass) as a relative frequency from the "result" column
p_pass = None

print("Mean:", mean_score, "Std:", std_score)
print("Q1/Median/Q3:", q1, median_score, q3)
print("P(Pass):", p_pass)
`,
  datasetUrl: "/datasets/exam_scores.csv",
  datasetPreviewMd: csvPreviewMd("exam_scores.csv"),
  autograderCode:
    AUTOGRADER_PREAMBLE +
    `
import pandas as pd

_ref = pd.read_csv("data.csv")
_ref_mean = _ref["score"].mean()
_ref_var = _ref["score"].var()
_ref_std = _ref["score"].std()
_ref_q1 = _ref["score"].quantile(0.25)
_ref_median = _ref["score"].median()
_ref_q3 = _ref["score"].quantile(0.75)
_ref_p_pass = (_ref["result"] == "Pass").mean()

_check(lambda: abs(mean_score - _ref_mean) < 0.5, "mean_score matches the dataset mean", 15)
_check(lambda: abs(variance_score - _ref_var) < 5, "variance_score matches the dataset variance", 15)
_check(lambda: abs(std_score - _ref_std) < 0.5, "std_score matches the dataset std", 10)
_check(lambda: abs(q1 - _ref_q1) < 1, "q1 matches the 25th percentile", 10)
_check(lambda: abs(median_score - _ref_median) < 1, "median_score matches the median", 10)
_check(lambda: abs(q3 - _ref_q3) < 1, "q3 matches the 75th percentile", 10)
_check(lambda: abs(p_pass - _ref_p_pass) < 0.03, "p_pass matches the relative frequency of passing", 30)
` + finalizeResult(),
  maxScore: 100,
  estMinutes: 35,
});

// ---------------------------------------------------------------------------
// 3. Linear Regression for Prediction (Unit 2)
// ---------------------------------------------------------------------------
experiments.push({
  orderIndex: 3,
  title: "Linear Regression for Prediction",
  syllabusUnit: "Unit 2 - Supervised Learning: Regression",
  questionMd: `A small real-estate startup wants a quick, explainable price estimator for their
listings - nothing fancy, just something that tells a homeowner "based on size, bedrooms,
age, and distance from the city, your house is roughly worth X lakhs."

You have \`data.csv\` with 300 recent sales. Fit a linear regression model that predicts
\`price_lakhs\` from the other numeric features, and report how well it explains the
variation in price.`,
  manualMd: `## The linear regression model

Linear regression assumes the target is a weighted sum of the input features plus an
intercept:

$$\\hat{y} = w_0 + w_1 x_1 + w_2 x_2 + \\dots + w_n x_n$$

Fitting the model means finding the weights (\`coef_\`) and intercept (\`intercept_\`) that
minimize the sum of squared errors between predictions and actual values - the
**least-squares** solution.

## Fitting with scikit-learn

\`\`\`python
from sklearn.linear_model import LinearRegression

X = df[["size_sqft", "bedrooms", "age_years", "distance_to_city_km"]]
y = df["price_lakhs"]

model = LinearRegression()
model.fit(X, y)
\`\`\`

After fitting, \`model.coef_\` is an array of weights (one per feature, in the same order
as \`X\`'s columns) and \`model.intercept_\` is \`w_0\`.

## Evaluating the fit: R²

The **coefficient of determination** (R²) tells you what fraction of the variance in
\`y\` your model explains, on a scale from 0 (no better than predicting the mean) to 1
(perfect fit):

\`\`\`python
r2 = model.score(X, y)
\`\`\`

An R² of 0.7 means 70% of the variation in house price is explained by your four
features - a reasonable result for a model this simple.

## Your task

Fit a \`LinearRegression\` model called \`model\` on the four numeric features to predict
\`price_lakhs\`, then compute its R² score into a variable called \`r2\`. The autograder
checks that \`model\` is a fitted regression with real coefficients and that \`r2\` clears
a reasonable bar.`,
  hintsMd: `**Hint 1.** \`X\` should be a DataFrame of the four feature columns; \`y\` should be the
single \`price_lakhs\` column (a Series, not a DataFrame).

**Hint 2.** \`model.fit(X, y)\` mutates \`model\` in place - you don't need to reassign the
result of \`.fit()\`.

**Hint 3.** \`model.score(X, y)\` computes R² directly - you don't need to import a
separate metrics function for this experiment.

**Hint 4.** If your R² looks unexpectedly low, double-check you passed all four feature
columns to \`X\`, not just one or two.`,
  starterCode: `import pandas as pd
from sklearn.linear_model import LinearRegression

df = pd.read_csv("data.csv")

FEATURES = ["size_sqft", "bedrooms", "age_years", "distance_to_city_km"]
X = df[FEATURES]
y = df["price_lakhs"]

# TODO: construct a LinearRegression model and fit it on X, y
model = None

# TODO: compute the R^2 score of the fitted model on X, y
r2 = None

print("Coefficients:", dict(zip(FEATURES, model.coef_)))
print("Intercept:", model.intercept_)
print("R^2:", r2)
`,
  datasetUrl: "/datasets/house_prices.csv",
  datasetPreviewMd: csvPreviewMd("house_prices.csv"),
  autograderCode:
    AUTOGRADER_PREAMBLE +
    `
_check(lambda: hasattr(model, "coef_"), "model has been fitted (coef_ exists)", 25)
_check(lambda: len(model.coef_) == 4, "model was fit on all 4 features", 20)
_check(lambda: isinstance(r2, float) or hasattr(r2, "item"), "r2 is a numeric score", 10)
_check(lambda: r2 > 0.5, "r2 exceeds 0.5 (model explains most of the variance)", 30)
_check(lambda: model.score(X, y) > 0.5, "model.score(X, y) independently exceeds 0.5", 15)
` + finalizeResult(),
  maxScore: 100,
  estMinutes: 40,
});

// ---------------------------------------------------------------------------
// 4. Bayesian Logistic Regression for Classification (Unit 2)
// ---------------------------------------------------------------------------
experiments.push({
  orderIndex: 4,
  title: "Bayesian Logistic Regression for Classification",
  syllabusUnit: "Unit 2 - Supervised Learning: Classification",
  questionMd: `A microfinance lender wants to automate a first-pass decision on loan applications:
approve or flag for manual review. They've given you 300 historical applications with
income, credit score, and debt ratio, along with the actual approval outcome.

Build a logistic regression classifier that predicts \`approved\` (0 or 1) from the three
numeric features, and report its accuracy and confusion matrix.`,
  manualMd: `## From regression to classification

Logistic regression adapts the linear-model idea to binary outcomes. Instead of
predicting a continuous value directly, it predicts the **log-odds** of the positive
class as a linear combination of the features, then squashes that through the sigmoid
function to get a probability between 0 and 1:

$$P(y=1 \\mid x) = \\sigma(w_0 + w_1 x_1 + \\dots + w_n x_n), \\qquad \\sigma(z) = \\frac{1}{1 + e^{-z}}$$

## Where "Bayesian" comes in

Plain (maximum-likelihood) logistic regression can overfit when features are correlated
or data is limited, because it has no preference among weight settings beyond fitting
the training data. A **Bayesian** treatment puts a prior distribution over the weights -
commonly a Gaussian centered at zero - which pulls extreme, overfit weights back toward
zero. In practice, this is exactly what **L2-regularized logistic regression** does: the
regularization term is mathematically equivalent to a Gaussian prior, and the fitted
weights are the *maximum a posteriori* (MAP) estimate rather than the raw maximum
likelihood estimate. scikit-learn's \`LogisticRegression\` applies L2 regularization by
default, so using it directly gives you this Bayesian-flavored estimate without any
extra setup.

\`\`\`python
from sklearn.linear_model import LogisticRegression

model = LogisticRegression()
model.fit(X, y)
\`\`\`

## Evaluating a classifier

- **Accuracy** - fraction of predictions that match the true label:
  \`model.score(X, y)\` or \`accuracy_score(y, model.predict(X))\`.
- **Confusion matrix** - a 2x2 table of true vs. predicted classes
  (\`confusion_matrix(y, model.predict(X))\`), showing not just how often you're right,
  but *which* kind of mistake you're making (false approvals vs. false rejections).

## Your task

Fit a \`LogisticRegression\` called \`model\` on \`income_lakhs\`, \`credit_score\`, and
\`debt_ratio\` to predict \`approved\`. Compute \`accuracy\` and a \`conf_matrix\` (as a NumPy
array from \`confusion_matrix\`).`,
  hintsMd: `**Hint 1.** \`from sklearn.linear_model import LogisticRegression\` - same import
pattern as linear regression, different class.

**Hint 2.** \`from sklearn.metrics import accuracy_score, confusion_matrix\` gives you
both evaluation functions in one import.

**Hint 3.** \`confusion_matrix(y_true, y_pred)\` expects the true labels first, predicted
labels second - swapping the order transposes the matrix and will confuse your reading
of it (though the autograder only checks its shape).

**Hint 4.** If accuracy seems low, check that \`credit_score\` isn't dominating the fit
purely because of its scale (300-900) compared to \`debt_ratio\` (0-1) - this dataset is
generated to be learnable without scaling, but it's a good habit to keep in mind for
real data.`,
  starterCode: `import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix

df = pd.read_csv("data.csv")

FEATURES = ["income_lakhs", "credit_score", "debt_ratio"]
X = df[FEATURES]
y = df["approved"]

# TODO: construct a LogisticRegression model and fit it on X, y
model = None

predictions = model.predict(X)

# TODO: compute accuracy and the confusion matrix
accuracy = None
conf_matrix = None

print("Accuracy:", accuracy)
print("Confusion matrix:\\n", conf_matrix)
`,
  datasetUrl: "/datasets/loan_approval.csv",
  datasetPreviewMd: csvPreviewMd("loan_approval.csv"),
  autograderCode:
    AUTOGRADER_PREAMBLE +
    `
_check(lambda: hasattr(model, "coef_"), "model has been fitted (coef_ exists)", 20)
_check(lambda: len(model.coef_[0]) == 3, "model was fit on all 3 features", 15)
_check(lambda: accuracy > 0.65, "accuracy exceeds 0.65", 30)
_check(lambda: conf_matrix.shape == (2, 2), "conf_matrix is a 2x2 confusion matrix", 20)
_check(lambda: conf_matrix.sum() == len(y), "conf_matrix accounts for every sample", 15)
` + finalizeResult(),
  maxScore: 100,
  estMinutes: 45,
});

// ---------------------------------------------------------------------------
// 5. SVM Classification with Kernels (Unit 2)
// ---------------------------------------------------------------------------
experiments.push({
  orderIndex: 5,
  title: "SVM Classification with Kernels",
  syllabusUnit: "Unit 2 - Supervised Learning: Classification",
  questionMd: `A quality-control sensor outputs two readings per unit, and engineering suspects the
"defective" units cluster in a ring around the "normal" ones rather than falling neatly
on one side of a line - a shape a straight-line classifier can't capture.

You have \`data.csv\` with 300 labeled readings. Train two SVM classifiers - one with a
linear kernel, one with an RBF kernel - and compare which one actually captures the
pattern.`,
  manualMd: `## Support Vector Machines

An SVM finds the decision boundary that maximizes the margin - the distance between the
boundary and the nearest points of each class (the *support vectors*). With a **linear
kernel**, that boundary is a straight line (or hyperplane in higher dimensions):

\`\`\`python
from sklearn.svm import SVC

model_linear = SVC(kernel="linear")
model_linear.fit(X, y)
\`\`\`

## The kernel trick

Some datasets aren't linearly separable - no straight line correctly divides the
classes, no matter how you draw it. The **kernel trick** lets an SVM find a linear
boundary in a higher-dimensional transformed feature space, without ever explicitly
computing that transformation, by replacing dot products with a kernel function. The
**RBF (radial basis function) kernel** is the most common choice for this - it
effectively measures similarity based on distance, which makes it well-suited to
boundaries that curve around clusters (like a ring):

\`\`\`python
model_rbf = SVC(kernel="rbf")
model_rbf.fit(X, y)
\`\`\`

## Comparing the two

Since both models are evaluated the same way - accuracy on the same data - the
comparison is direct:

\`\`\`python
from sklearn.metrics import accuracy_score

acc_linear = accuracy_score(y, model_linear.predict(X))
acc_rbf = accuracy_score(y, model_rbf.predict(X))
\`\`\`

For data with a genuinely non-linear boundary (like two classes arranged in concentric
rings), you should see the RBF kernel noticeably outperform the linear one - the linear
kernel can only draw a straight line through a ring-shaped pattern, so it's stuck near
50% accuracy no matter how it's positioned.

## Your task

Fit \`model_linear\` (kernel=\`"linear"\`) and \`model_rbf\` (kernel=\`"rbf"\`) on
\`feature1\`/\`feature2\` to predict \`label\`. Compute \`acc_linear\` and \`acc_rbf\`.`,
  hintsMd: `**Hint 1.** Both models use the same \`X\`/\`y\` - only the \`kernel=\` argument differs
between them.

**Hint 2.** \`SVC\` defaults to \`kernel="rbf"\` already, but set it explicitly for
\`model_rbf\` so your intent is clear in the code.

**Hint 3.** If both accuracies come out similar and mediocre, double check you're
passing both \`feature1\` and \`feature2\` as \`X\` - a ring pattern is inseparable in either
feature alone.

**Hint 4.** Plotting \`feature1\` vs \`feature2\`, colored by \`label\`, with
\`plt.scatter(df["feature1"], df["feature2"], c=df["label"])\` makes the ring shape - and
why a straight line can't separate it - immediately obvious.`,
  starterCode: `import pandas as pd
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score

df = pd.read_csv("data.csv")

X = df[["feature1", "feature2"]]
y = df["label"]

# TODO: construct and fit a linear-kernel SVM
model_linear = None

# TODO: construct and fit an RBF-kernel SVM
model_rbf = None

acc_linear = accuracy_score(y, model_linear.predict(X))
acc_rbf = accuracy_score(y, model_rbf.predict(X))

print("Linear kernel accuracy:", acc_linear)
print("RBF kernel accuracy:", acc_rbf)
`,
  datasetUrl: "/datasets/signal_classification.csv",
  datasetPreviewMd: csvPreviewMd("signal_classification.csv"),
  autograderCode:
    AUTOGRADER_PREAMBLE +
    `
_check(lambda: model_linear.kernel == "linear", "model_linear uses a linear kernel", 10)
_check(lambda: model_rbf.kernel == "rbf", "model_rbf uses an RBF kernel", 10)
_check(lambda: acc_rbf > 0.85, "RBF kernel accuracy exceeds 0.85", 35)
_check(lambda: acc_rbf > acc_linear + 0.1, "RBF kernel clearly outperforms the linear kernel on this non-linear boundary", 35)
_check(lambda: 0.0 <= acc_linear <= 1.0 and 0.0 <= acc_rbf <= 1.0, "accuracy values are valid probabilities", 10)
` + finalizeResult(),
  maxScore: 100,
  estMinutes: 45,
});

// ---------------------------------------------------------------------------
// 6. K-Means Clustering (Unit 3)
// ---------------------------------------------------------------------------
experiments.push({
  orderIndex: 6,
  title: "K-Means Clustering",
  syllabusUnit: "Unit 3 - Unsupervised Learning: Clustering",
  questionMd: `A retail chain wants to segment its customers for targeted marketing, but has no
predefined categories - just raw data: each customer's annual income and a
"spending score" derived from purchase behavior. There are no labels to learn from,
only structure to discover.

You have \`data.csv\` with 300 customers. Use K-Means to group them into 4 segments,
visualize the result, and report how tight the clusters are.`,
  manualMd: `## Unsupervised learning: finding structure without labels

Every model so far has learned from labeled examples. K-Means is different: given only
feature values (no target), it partitions the data into \`k\` groups such that points in
the same group are close to each other.

## How K-Means works

1. Pick \`k\` initial cluster centers (K-Means++ initialization, scikit-learn's default,
   picks smart starting points rather than pure random ones).
2. Assign every point to its nearest center.
3. Recompute each center as the mean of the points assigned to it.
4. Repeat steps 2-3 until assignments stop changing.

\`\`\`python
from sklearn.cluster import KMeans

model = KMeans(n_clusters=4, random_state=42, n_init=10)
model.fit(X)
\`\`\`

After fitting: \`model.labels_\` gives each point's assigned cluster (0 to k-1),
\`model.cluster_centers_\` gives the final center coordinates, and \`model.inertia_\` gives
the sum of squared distances from each point to its assigned center - a measure of how
tight the clusters are (lower is tighter, though it always decreases as \`k\` increases,
so it's only meaningful for comparing runs with the same \`k\`).

## Visualizing

With only 2 features, a scatter plot colored by cluster assignment tells you almost
everything at a glance:

\`\`\`python
import matplotlib.pyplot as plt

plt.scatter(X["annual_income_k"], X["spending_score"], c=model.labels_)
plt.scatter(model.cluster_centers_[:, 0], model.cluster_centers_[:, 1], marker="X", s=200, c="red")
plt.xlabel("Annual income (k)")
plt.ylabel("Spending score")
plt.show()
\`\`\`

## Measuring cluster quality

The **silhouette score** measures, for each point, how much closer it is to its own
cluster than to the next-nearest one, averaged across all points. It ranges from -1
(likely misassigned) to 1 (well-clustered); above 0.5 generally indicates clearly
separated clusters.

\`\`\`python
from sklearn.metrics import silhouette_score
score = silhouette_score(X, model.labels_)
\`\`\`

## Your task

Fit a \`KMeans\` model called \`model\` with \`n_clusters=4\` on \`annual_income_k\` and
\`spending_score\`. Compute the silhouette score into \`sil_score\`.`,
  hintsMd: `**Hint 1.** Pass \`n_clusters=4\` explicitly - the default is 8, which would badly
over-segment this data.

**Hint 2.** Setting \`random_state=42\` makes your results reproducible run to run, which
matters when you're comparing inertia or silhouette scores across attempts.

**Hint 3.** \`model.labels_\` and \`model.cluster_centers_\` are only available *after*
calling \`.fit()\` - accessing them before will raise an error.

**Hint 4.** If your silhouette score looks low, check you didn't accidentally include an
ID column in \`X\` - clustering on \`customer_id\` alongside the real features will wreck
the distances.`,
  starterCode: `import pandas as pd
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

df = pd.read_csv("data.csv")
X = df[["annual_income_k", "spending_score"]]

# TODO: construct a KMeans model with n_clusters=4 and fit it on X
model = None

# TODO: compute the silhouette score
sil_score = None

plt.scatter(X["annual_income_k"], X["spending_score"], c=model.labels_, cmap="viridis")
plt.scatter(model.cluster_centers_[:, 0], model.cluster_centers_[:, 1], marker="X", s=200, c="red")
plt.xlabel("Annual income (k)")
plt.ylabel("Spending score")
plt.title("Customer segments")
plt.show()

print("Inertia:", model.inertia_)
print("Silhouette score:", sil_score)
`,
  datasetUrl: "/datasets/customer_segmentation.csv",
  datasetPreviewMd: csvPreviewMd("customer_segmentation.csv"),
  autograderCode:
    AUTOGRADER_PREAMBLE +
    `
_check(lambda: hasattr(model, "cluster_centers_"), "model has been fitted (cluster_centers_ exists)", 20)
_check(lambda: model.cluster_centers_.shape == (4, 2), "model was fit with 4 clusters on 2 features", 20)
_check(lambda: model.inertia_ > 0, "model.inertia_ is a positive number", 10)
_check(lambda: sil_score > 0.5, "silhouette score exceeds 0.5 (well-separated clusters)", 35)
_check(lambda: len(set(model.labels_)) == 4, "all 4 clusters were actually used", 15)
` + finalizeResult(),
  maxScore: 100,
  estMinutes: 40,
});

// ---------------------------------------------------------------------------
// 7. Gaussian Mixture Models & EM (Unit 3)
// ---------------------------------------------------------------------------
experiments.push({
  orderIndex: 7,
  title: "Gaussian Mixture Models & EM",
  syllabusUnit: "Unit 3 - Unsupervised Learning: Clustering",
  questionMd: `The marketing team from the previous experiment has a follow-up question: K-Means gave
every customer a single, hard segment label - but some customers genuinely sit on the
boundary between two segments. They want to know *how confident* the model is about
each assignment, not just what it decided.

Using the same customer data, fit a Gaussian Mixture Model and compare its soft
cluster assignments to K-Means' hard ones.`,
  manualMd: `## From hard to soft clustering

K-Means assigns each point to exactly one cluster - a **hard** assignment. A **Gaussian
Mixture Model (GMM)** instead models the data as a weighted combination of several
Gaussian distributions, and for each point reports the *probability* it belongs to each
component - a **soft** assignment. A point near the boundary between two clusters might
get 55%/45% probabilities instead of being forced into one bucket.

## The EM algorithm

GMMs are fit with **Expectation-Maximization (EM)**, which alternates two steps until
convergence:

- **E-step**: given the current Gaussian parameters, compute the probability each point
  belongs to each component (the "responsibility" of each component for each point).
- **M-step**: given those responsibilities, update each Gaussian's mean, covariance, and
  weight to better fit the points it's responsible for.

This is a soft-assignment analogue of K-Means' assign/recompute loop.

\`\`\`python
from sklearn.mixture import GaussianMixture

gmm = GaussianMixture(n_components=4, random_state=42, n_init=10)
gmm.fit(X)
\`\`\`

After fitting: \`gmm.means_\` gives each component's center (shape \`(n_components,
n_features)\`, like K-Means' \`cluster_centers_\`), \`gmm.predict(X)\` gives hard labels for
comparison, and \`gmm.predict_proba(X)\` gives the full soft assignment - one probability
per component, per point.

## Comparing to K-Means

\`\`\`python
soft_probs = gmm.predict_proba(X)
hard_labels_gmm = gmm.predict(X)
\`\`\`

Look at \`soft_probs\` for points near a cluster boundary: their probabilities will be
much less extreme (e.g. 0.6/0.3/0.05/0.05) than points deep inside a cluster (e.g.
0.99/0.01/0/0) - that's the soft-assignment information K-Means simply doesn't give you.

## Your task

Fit a \`GaussianMixture\` called \`gmm\` with \`n_components=4\` on the same two features
used for K-Means. Store its soft assignments in \`soft_probs\`.`,
  hintsMd: `**Hint 1.** \`GaussianMixture\` lives in \`sklearn.mixture\`, not \`sklearn.cluster\` -
different module from K-Means.

**Hint 2.** \`n_components\` is GMM's equivalent of K-Means' \`n_clusters\` - keep it at 4
to match the previous experiment for a fair comparison.

**Hint 3.** \`gmm.predict_proba(X)\` returns an array of shape \`(n_samples, n_components)\`
- each row sums to 1, since it's a probability distribution over components for that
point.

**Hint 4.** If you want to see the "softness" directly, try
\`soft_probs.max(axis=1).mean()\` - the average of each point's top probability. A value
close to 1 means the model is very confident (hard-ish assignments); notably below 1
means genuine uncertainty is being captured.`,
  starterCode: `import pandas as pd
from sklearn.mixture import GaussianMixture

df = pd.read_csv("data.csv")
X = df[["annual_income_k", "spending_score"]]

# TODO: construct a GaussianMixture with n_components=4 and fit it on X
gmm = None

# TODO: get the soft (probabilistic) cluster assignments
soft_probs = None
hard_labels_gmm = gmm.predict(X)

print("Means:\\n", gmm.means_)
print("Converged:", gmm.converged_)
print("Average top-component confidence:", soft_probs.max(axis=1).mean())
`,
  datasetUrl: "/datasets/customer_segmentation.csv",
  datasetPreviewMd: csvPreviewMd("customer_segmentation.csv"),
  autograderCode:
    AUTOGRADER_PREAMBLE +
    `
_check(lambda: hasattr(gmm, "means_"), "gmm has been fitted (means_ exists)", 20)
_check(lambda: gmm.means_.shape == (4, 2), "gmm was fit with 4 components on 2 features", 20)
_check(lambda: gmm.converged_, "EM converged", 15)
_check(lambda: soft_probs.shape == (len(X), 4), "soft_probs has one probability row per sample", 20)
_check(lambda: abs(soft_probs.sum(axis=1) - 1).max() < 1e-6, "each point's component probabilities sum to 1", 15)
_check(lambda: soft_probs.max(axis=1).mean() < 0.999, "assignments are genuinely soft (not all near-certain)", 10)
` + finalizeResult(),
  maxScore: 100,
  estMinutes: 40,
});

// ---------------------------------------------------------------------------
// 8. Hierarchical Clustering (Unit 3)
// ---------------------------------------------------------------------------
experiments.push({
  orderIndex: 8,
  title: "Hierarchical Clustering",
  syllabusUnit: "Unit 3 - Unsupervised Learning: Clustering",
  questionMd: `A regional sales director wants to understand how 60 sales regions relate to each
other - not just which flat groups they fall into, but which regions are *similar to
which other regions*, at every level of granularity. That nested structure is exactly
what hierarchical clustering gives you, and a flat method like K-Means can't.

You have \`data.csv\` with 60 regions, each described by average order value and
purchase frequency. Build a dendrogram and cut it into 3 clusters.`,
  manualMd: `## Hierarchical vs. flat clustering

K-Means and GMM both require you to pick \`k\` upfront and produce one flat partition.
**Agglomerative hierarchical clustering** instead builds a full tree: it starts with
every point in its own cluster, then repeatedly merges the two closest clusters until
only one remains. The result - a **dendrogram** - lets you see the merge structure at
every level and choose how many clusters to keep afterward.

## Linkage: how "distance between clusters" is defined

Once clusters have more than one point, "distance between two clusters" needs a
definition - this is the **linkage** method. **Ward linkage** (the most common default)
merges the pair of clusters that leads to the smallest increase in total within-cluster
variance - it tends to produce compact, evenly-sized clusters.

\`\`\`python
from scipy.cluster.hierarchy import linkage, dendrogram, fcluster

Z = linkage(X, method="ward")
\`\`\`

\`Z\` is scipy's linkage matrix: each row records one merge as
\`[cluster_a, cluster_b, distance, num_points_in_new_cluster]\`. With 60 input points,
\`Z\` has 59 rows - one merge per step until everything is joined.

## Drawing the dendrogram

\`\`\`python
import matplotlib.pyplot as plt

dendrogram(Z)
plt.xlabel("Region")
plt.ylabel("Merge distance")
plt.show()
\`\`\`

Reading it: the height at which two branches join is the distance at which those groups
were merged. A long vertical gap before a merge suggests those groups were genuinely
distinct - a natural place to "cut" the tree.

## Cutting the tree into flat clusters

To get actual cluster labels (for downstream use, or grading), cut the tree at a chosen
number of clusters with \`fcluster\`:

\`\`\`python
cluster_labels = fcluster(Z, t=3, criterion="maxclust")
\`\`\`

## Your task

Compute the linkage matrix \`Z\` (Ward linkage) on \`avg_order_value\` and
\`purchase_frequency\`, plot a dendrogram, then cut it into 3 flat clusters stored in
\`cluster_labels\`.`,
  hintsMd: `**Hint 1.** \`linkage()\`, \`dendrogram()\`, and \`fcluster()\` all come from
\`scipy.cluster.hierarchy\` - one import line covers all three.

**Hint 2.** \`linkage(X, method="ward")\` expects \`X\` as a 2D array-like (a DataFrame of
your numeric feature columns works directly).

**Hint 3.** \`fcluster(Z, t=3, criterion="maxclust")\` is the "I want exactly 3 clusters"
call - \`t\` sets the target count when \`criterion="maxclust"\`.

**Hint 4.** \`cluster_labels\` from \`fcluster\` are 1-indexed (1, 2, 3 - not 0, 1, 2),
unlike scikit-learn's clustering outputs. This trips people up if they're comparing
labels directly across libraries.`,
  starterCode: `import pandas as pd
import matplotlib.pyplot as plt
from scipy.cluster.hierarchy import linkage, dendrogram, fcluster

df = pd.read_csv("data.csv")
X = df[["avg_order_value", "purchase_frequency"]]

# TODO: compute the Ward-linkage matrix on X
Z = None

plt.figure(figsize=(10, 5))
dendrogram(Z, labels=df["region_id"].tolist())
plt.xlabel("Region")
plt.ylabel("Merge distance")
plt.title("Regional sales dendrogram")
plt.show()

# TODO: cut the tree into 3 flat clusters
cluster_labels = None

print("Cluster sizes:", pd.Series(cluster_labels).value_counts().to_dict())
`,
  datasetUrl: "/datasets/regional_sales_clusters.csv",
  datasetPreviewMd: csvPreviewMd("regional_sales_clusters.csv"),
  autograderCode:
    AUTOGRADER_PREAMBLE +
    `
from sklearn.metrics import silhouette_score

_check(lambda: Z.shape == (len(X) - 1, 4), "Z is a valid linkage matrix (n-1 merges)", 25)
_check(lambda: len(cluster_labels) == len(X), "cluster_labels has one entry per region", 20)
_check(lambda: len(set(cluster_labels)) == 3, "the tree was cut into exactly 3 clusters", 25)
_check(lambda: silhouette_score(X, cluster_labels) > 0.5, "the 3 clusters are well-separated (silhouette > 0.5)", 30)
` + finalizeResult(),
  maxScore: 100,
  estMinutes: 40,
});

// ---------------------------------------------------------------------------
// 9. PCA & Dimensionality Reduction (Unit 3)
// ---------------------------------------------------------------------------
experiments.push({
  orderIndex: 9,
  title: "PCA & Dimensionality Reduction",
  syllabusUnit: "Unit 3 - Unsupervised Learning: Dimensionality Reduction",
  questionMd: `The academic office has 6 numeric measurements per student - three subject scores,
attendance, study hours, and extracurricular hours - and wants a single 2D "student
profile" chart they can actually look at, without picking just 2 of the 6 columns
arbitrarily.

You have \`data.csv\` with 300 students across 6 features. Reduce them to 2 principal
components and check how much of the original variation survives the compression.`,
  manualMd: `## Why reduce dimensions

With more than 2-3 features, you can't directly plot the data anymore, and many
features are often correlated (a student who studies more also tends to score higher
across *all* subjects) - meaning the "true" underlying structure has fewer effective
dimensions than the raw column count suggests. **Principal Component Analysis (PCA)**
finds a small number of new axes (principal components) that capture as much of the
original variance as possible.

## Standardizing first

PCA is sensitive to feature scale - a feature ranging 0-100 will dominate one ranging
0-5 purely because of units, not because it's more informative. Standardize first so
every feature has mean 0 and variance 1:

\`\`\`python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
\`\`\`

## Fitting PCA

\`\`\`python
from sklearn.decomposition import PCA

pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)
\`\`\`

\`X_pca\` has shape \`(n_samples, 2)\` - every student is now described by exactly 2 numbers
instead of 6, ready to plot.

## How much information survived

\`pca.explained_variance_ratio_\` is an array of length 2 - the fraction of total
variance captured by each component. Their sum tells you how much of the original
information the 2D projection retains:

\`\`\`python
total_explained = pca.explained_variance_ratio_.sum()
\`\`\`

For correlated features like these (academic performance tends to move together across
subjects), 2 components typically capture well over half the total variance - a strong
compression for a big drop in dimensionality.

## Visualizing

\`\`\`python
import matplotlib.pyplot as plt

plt.scatter(X_pca[:, 0], X_pca[:, 1], alpha=0.6)
plt.xlabel("PC1")
plt.ylabel("PC2")
plt.show()
\`\`\`

## Your task

Standardize the 6 numeric feature columns, fit a \`PCA\` with \`n_components=2\` called
\`pca\`, and store the transformed data in \`X_pca\`.`,
  hintsMd: `**Hint 1.** Fit the \`StandardScaler\` and \`PCA\` in sequence: scale first, then pass the
*scaled* array into \`PCA\`, not the raw DataFrame.

**Hint 2.** \`fit_transform\` does fitting and transforming in one call - you don't need a
separate \`.fit()\` followed by \`.transform()\` unless you specifically want to reuse the
fitted scaler/PCA on new data later.

**Hint 3.** \`pca.explained_variance_ratio_\` is only populated after \`.fit()\` (or
\`.fit_transform()\`) has been called - it doesn't exist on a freshly constructed,
unfitted \`PCA\` object.

**Hint 4.** If your explained variance looks surprisingly low, double check you scaled
*before* fitting PCA - skipping standardization is the most common reason PCA output
looks wrong.`,
  starterCode: `import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

df = pd.read_csv("data.csv")
FEATURES = ["math_score", "science_score", "english_score", "attendance_pct", "study_hours", "extracurricular_hours"]
X = df[FEATURES]

# TODO: standardize the features (mean 0, variance 1)
X_scaled = None

# TODO: fit a PCA with n_components=2 on X_scaled and transform it
pca = None
X_pca = None

plt.scatter(X_pca[:, 0], X_pca[:, 1], alpha=0.6)
plt.xlabel("PC1")
plt.ylabel("PC2")
plt.title("Student profiles in 2D")
plt.show()

print("Explained variance ratio:", pca.explained_variance_ratio_)
print("Total variance retained:", pca.explained_variance_ratio_.sum())
`,
  datasetUrl: "/datasets/student_profile_pca.csv",
  datasetPreviewMd: csvPreviewMd("student_profile_pca.csv"),
  autograderCode:
    AUTOGRADER_PREAMBLE +
    `
_check(lambda: hasattr(pca, "explained_variance_ratio_"), "pca has been fitted", 20)
_check(lambda: X_pca.shape == (len(X), 2), "X_pca has 2 components for every sample", 20)
_check(lambda: len(pca.explained_variance_ratio_) == 2, "pca was fit with n_components=2", 15)
_check(lambda: pca.explained_variance_ratio_.sum() > 0.5, "the 2 components retain over half the original variance", 35)
_check(lambda: abs(X_scaled.mean()) < 0.5, "features were standardized before PCA (near-zero mean)", 10)
` + finalizeResult(),
  maxScore: 100,
  estMinutes: 45,
});

// ---------------------------------------------------------------------------
// 10. Hidden Markov Models for Sequential Data (Unit 4)
// ---------------------------------------------------------------------------
experiments.push({
  orderIndex: 10,
  title: "Hidden Markov Models for Sequential Data",
  syllabusUnit: "Unit 4 - Probabilistic Sequence Models",
  questionMd: `A weather station's sensor broke months ago, so nobody recorded whether each day was
Sunny or Rainy directly - but the station keeper's daily activity log survived (Walk,
Shop, or Clean), and activity choices depend on the weather. You've been asked to
reconstruct the most likely weather sequence from the activity log alone.

You have \`data.csv\` with 300 days of activities and, for evaluation purposes only, the
true weather (which your algorithm must not use as input). Implement the Viterbi
algorithm to decode the most likely hidden weather sequence.`,
  manualMd: `## Hidden states and observations

A Hidden Markov Model describes a system with two layers: a sequence of **hidden
states** that evolves as a Markov chain (each state depends only on the previous one),
and a sequence of **observations**, where each observation depends only on the current
hidden state. Here, the hidden states are \`Sunny\`/\`Rainy\` (unobserved), and the
observations are the logged activities \`Walk\`/\`Shop\`/\`Clean\` (what you actually see).

An HMM is defined by three probability tables:

- **Transition probabilities** \`A[i][j]\` - P(tomorrow's state = j | today's state = i)
- **Emission probabilities** \`B[i][k]\` - P(observation = k | state = i)
- **Initial probabilities** \`pi[i]\` - P(first state = i)

Since this dataset happens to include the true (hidden) weather for evaluation, we can
**estimate** these probabilities directly by counting - the same idea as the
relative-frequency probability estimate from Experiment 2, just applied per-state.

## The Viterbi algorithm

Given the three tables and an observation sequence, **Viterbi** finds the single most
likely hidden state sequence using dynamic programming. At each time step \`t\`, for each
state \`j\`, it tracks the probability of the best path ending in state \`j\` at time \`t\`:

$$\\delta_t(j) = \\max_i \\big[ \\delta_{t-1}(i) \\cdot A[i][j] \\big] \\cdot B[j][o_t]$$

Working forward through the sequence and remembering which previous state gave the max
at each step, you can walk backward at the end to recover the full best-path sequence -
without ever having to enumerate all $2^{300}$ possible weather sequences directly.

## Why not \`hmmlearn\`?

This experiment implements Viterbi from scratch with NumPy rather than a dedicated HMM
library, so you actually see the dynamic-programming recursion that makes decoding
tractable - the same technique reappears all over sequence modeling.

## Your task

Using the starter code's counting-based estimates of \`A\`, \`B\`, and \`pi\`, implement the
\`viterbi(obs_indices, A, B, pi)\` function and use it to produce \`predicted_states\` - your
best guess at the hidden weather for every day. The autograder checks your predictions
against the true (held-out) weather column.`,
  hintsMd: `**Hint 1.** Work in log-space if you're worried about numerical underflow over 300
steps, but for this dataset length, plain probabilities (not logs) are precise enough -
don't over-engineer it.

**Hint 2.** You need two DP tables of shape \`(num_days, num_states)\`: \`delta\` (best
probability so far) and \`psi\` (which previous state achieved it, for backtracking).

**Hint 3.** After filling \`delta\` forward through all days, find the best final state
with \`delta[-1].argmax()\`, then walk backward through \`psi\` to recover the full path -
don't try to pick the best state independently at each time step, that's a different
(and wrong) algorithm.

**Hint 4.** The starter code already builds \`A\`, \`B\`, and \`pi\` by counting transitions
and emissions in the data - you're implementing the *decoding* step, not the parameter
estimation step.`,
  starterCode: `import numpy as np
import pandas as pd

df = pd.read_csv("data.csv")

STATES = ["Sunny", "Rainy"]
OBS = ["Walk", "Shop", "Clean"]
state_idx = {s: i for i, s in enumerate(STATES)}
obs_idx = {o: i for i, o in enumerate(OBS)}

weather_seq = df["true_weather"].tolist()
activity_seq = df["activity"].tolist()

# Estimate HMM parameters by counting (same idea as Experiment 2's relative frequency)
n_states = len(STATES)
n_obs = len(OBS)

pi = np.zeros(n_states)
pi[state_idx[weather_seq[0]]] = 1.0

A = np.ones((n_states, n_states))  # Laplace smoothing to avoid zero probabilities
B = np.ones((n_states, n_obs))

for t in range(len(weather_seq) - 1):
    i, j = state_idx[weather_seq[t]], state_idx[weather_seq[t + 1]]
    A[i, j] += 1

for t in range(len(weather_seq)):
    i, k = state_idx[weather_seq[t]], obs_idx[activity_seq[t]]
    B[i, k] += 1

A = A / A.sum(axis=1, keepdims=True)
B = B / B.sum(axis=1, keepdims=True)

obs_indices = [obs_idx[a] for a in activity_seq]


def viterbi(obs_indices, A, B, pi):
    """Returns the most likely hidden state index sequence for obs_indices."""
    n = len(obs_indices)
    n_states = A.shape[0]

    delta = np.zeros((n, n_states))
    psi = np.zeros((n, n_states), dtype=int)

    # TODO: initialize delta[0] using pi and B
    # delta[0] = ...

    # TODO: fill delta and psi forward through the sequence
    # for t in range(1, n):
    #     for j in range(n_states):
    #         ...

    # TODO: backtrack from the best final state (argmax of delta[-1])
    #       through psi to recover the full path
    path = np.zeros(n, dtype=int)

    return path


predicted_indices = viterbi(obs_indices, A, B, pi)
predicted_states = [STATES[i] for i in predicted_indices]

accuracy = np.mean([p == t for p, t in zip(predicted_states, weather_seq)])
print("Decoding accuracy vs true weather:", accuracy)
`,
  datasetUrl: "/datasets/weather_activities.csv",
  datasetPreviewMd: csvPreviewMd("weather_activities.csv"),
  autograderCode:
    AUTOGRADER_PREAMBLE +
    `
_check(lambda: len(predicted_states) == len(weather_seq), "predicted_states covers every day in the sequence", 20)
_check(lambda: set(predicted_states).issubset(set(STATES)), "predicted_states only contains valid weather states", 15)
_check(lambda: accuracy > 0.6, "decoding accuracy exceeds 0.6 against the true weather", 40)
_check(lambda: len(set(predicted_states)) > 1, "the decoded sequence actually uses both states (not a degenerate all-one-state guess)", 25)
` + finalizeResult(),
  maxScore: 100,
  estMinutes: 55,
});

// ---------------------------------------------------------------------------
// 11. CART / Decision Trees for Categorization (Unit 5)
// ---------------------------------------------------------------------------
experiments.push({
  orderIndex: 11,
  title: "CART / Decision Trees for Categorization",
  syllabusUnit: "Unit 5 - Tree-Based Methods",
  questionMd: `HR wants a model they can actually explain to a manager in one sentence - not a black
box, a set of readable if/then rules for predicting which employees are at risk of
leaving.

You have \`data.csv\` with 300 employee records: age, income, tenure, job satisfaction,
and whether they left (\`attrition\`). Train a decision tree classifier and report its
depth and accuracy.`,
  manualMd: `## How a decision tree splits

A decision tree (using the **CART** - Classification and Regression Trees - algorithm)
builds a set of nested if/then rules by repeatedly splitting the data on the feature and
threshold that best separates the classes. At each node, it evaluates every possible
split and picks the one that most reduces **impurity** - commonly measured with the
**Gini index**:

$$\\text{Gini} = 1 - \\sum_{c} p_c^2$$

where $p_c$ is the fraction of samples at that node belonging to class $c$. A pure node
(all one class) has Gini 0; a node split evenly between classes has higher Gini. The
tree keeps splitting, node by node, until nodes are pure or a stopping condition (like
max depth) is reached.

## Fitting with scikit-learn

\`\`\`python
from sklearn.tree import DecisionTreeClassifier

model = DecisionTreeClassifier(max_depth=4, random_state=42)
model.fit(X, y)
\`\`\`

Limiting \`max_depth\` matters: an unconstrained tree will keep splitting until every leaf
is pure, which usually means memorizing the training data (overfitting) rather than
learning a generalizable pattern.

## Reading the result

- \`model.get_depth()\` - the tree's actual depth (may be less than \`max_depth\` if it
  stopped splitting earlier).
- \`model.score(X, y)\` - accuracy on the given data.
- \`from sklearn.tree import plot_tree; plot_tree(model, feature_names=..., filled=True)\`
  - draws the actual decision rules, which is the whole point of using a tree over a
  less-interpretable model.

## Your task

Fit a \`DecisionTreeClassifier\` called \`model\` (with \`max_depth=4\`) on \`age\`,
\`monthly_income_k\`, \`years_at_company\`, and \`job_satisfaction\` to predict \`attrition\`.
Compute its accuracy.`,
  hintsMd: `**Hint 1.** \`attrition\` in the raw data is the string \`"Yes"\`/\`"No"\` - scikit-learn's
classifiers handle string labels natively, no manual encoding required.

**Hint 2.** \`max_depth=4\` is provided in the starter code deliberately - removing it
will still "work" but tends to produce a tree that overfits the training data.

**Hint 3.** \`model.get_depth()\` only works after fitting - accessing it on an unfitted
tree raises an error.

**Hint 4.** If accuracy seems low, double check all four feature columns made it into
\`X\` - a tree with only 1-2 features has much less to split on.`,
  starterCode: `import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score

df = pd.read_csv("data.csv")

FEATURES = ["age", "monthly_income_k", "years_at_company", "job_satisfaction"]
X = df[FEATURES]
y = df["attrition"]

# TODO: construct a DecisionTreeClassifier with max_depth=4 and fit it on X, y
model = None

predictions = model.predict(X)
accuracy = accuracy_score(y, predictions)

print("Tree depth:", model.get_depth())
print("Accuracy:", accuracy)
`,
  datasetUrl: "/datasets/employee_attrition.csv",
  datasetPreviewMd: csvPreviewMd("employee_attrition.csv"),
  autograderCode:
    AUTOGRADER_PREAMBLE +
    `
_check(lambda: hasattr(model, "tree_"), "model has been fitted", 20)
_check(lambda: model.get_depth() <= 4, "tree respects the max_depth=4 constraint", 15)
_check(lambda: accuracy > 0.7, "accuracy exceeds 0.7", 40)
_check(lambda: len(model.feature_importances_) == 4, "model was fit on all 4 features", 25)
` + finalizeResult(),
  maxScore: 100,
  estMinutes: 40,
});

// ---------------------------------------------------------------------------
// 12. Ensemble Learning: Boosting & Bagging (Unit 5)
// ---------------------------------------------------------------------------
experiments.push({
  orderIndex: 12,
  title: "Ensemble Learning: Boosting & Bagging",
  syllabusUnit: "Unit 5 - Tree-Based Methods",
  questionMd: `HR liked the decision tree from the last experiment, but wants to know if they can do
better before rolling it out - specifically, whether combining many trees beats relying
on just one.

Using the same employee data, train a single decision tree, a bagged ensemble (Random
Forest), and a boosted ensemble (AdaBoost), then compare all three.`,
  manualMd: `## Why combine models

A single decision tree is prone to overfitting - small changes in the training data can
produce a very different tree (high variance). **Ensemble methods** combine many models
to get better, more stable predictions than any one of them alone. The two dominant
strategies are **bagging** and **boosting**.

## Bagging: Random Forest

**Bagging** (bootstrap aggregating) trains many trees independently, each on a random
resampled subset of the training data (with replacement), and each considering only a
random subset of features at every split. Predictions are combined by majority vote.
Averaging over many high-variance, low-bias trees cancels out their individual
overfitting tendencies.

\`\`\`python
from sklearn.ensemble import RandomForestClassifier

rf_model = RandomForestClassifier(n_estimators=100, max_depth=4, random_state=42)
rf_model.fit(X, y)
\`\`\`

## Boosting: AdaBoost

**Boosting** trains trees *sequentially*, where each new tree focuses on the examples
the previous trees got wrong - misclassified points get higher weight in the next
round. Rather than reducing variance like bagging, boosting reduces **bias**: it turns a
collection of weak learners (here, shallow trees) into a strong one by having each new
learner specifically patch the previous ensemble's mistakes.

\`\`\`python
from sklearn.ensemble import AdaBoostClassifier
from sklearn.tree import DecisionTreeClassifier

ada_model = AdaBoostClassifier(
    estimator=DecisionTreeClassifier(max_depth=2),
    n_estimators=100,
    random_state=42,
)
ada_model.fit(X, y)
\`\`\`

## Comparing all three

\`\`\`python
from sklearn.metrics import accuracy_score

acc_tree = accuracy_score(y, tree_model.predict(X))
acc_rf = accuracy_score(y, rf_model.predict(X))
acc_ada = accuracy_score(y, ada_model.predict(X))
\`\`\`

Both ensembles should match or beat the single tree - that improvement, even on data a
single reasonably-tuned tree already handles decently, is the entire point of ensemble
methods.

## Your task

Fit \`tree_model\` (a single \`DecisionTreeClassifier\`, \`max_depth=4\`), \`rf_model\` (a
\`RandomForestClassifier\`), and \`ada_model\` (an \`AdaBoostClassifier\`) on the same
features as the previous experiment. Compute all three accuracies.`,
  hintsMd: `**Hint 1.** Reuse the same \`X\`/\`y\` setup as the decision tree experiment - the point
here is comparing *models*, not changing the data.

**Hint 2.** \`RandomForestClassifier(n_estimators=100)\` trains 100 trees under the hood -
more estimators generally help up to a point, at the cost of speed.

**Hint 3.** \`AdaBoostClassifier\` needs a weak base estimator - a shallow tree
(\`max_depth=1\` or \`2\`) is the standard choice, since boosting works by combining many
*weak* learners, not a few strong ones.

**Hint 4.** If the ensembles don't clearly beat the single tree, check you're evaluating
all three on the same \`X\`/\`y\` - an unfair comparison (e.g. different feature subsets)
will produce misleading results.`,
  starterCode: `import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, AdaBoostClassifier
from sklearn.metrics import accuracy_score

df = pd.read_csv("data.csv")

FEATURES = ["age", "monthly_income_k", "years_at_company", "job_satisfaction"]
X = df[FEATURES]
y = df["attrition"]

# TODO: construct and fit a single decision tree (baseline), max_depth=4
tree_model = None

# TODO: construct and fit a bagged ensemble (RandomForestClassifier, n_estimators=100, max_depth=4)
rf_model = None

# TODO: construct and fit a boosted ensemble (AdaBoostClassifier with a
#       shallow DecisionTreeClassifier(max_depth=2) as its base estimator, n_estimators=100)
ada_model = None

acc_tree = accuracy_score(y, tree_model.predict(X))
acc_rf = accuracy_score(y, rf_model.predict(X))
acc_ada = accuracy_score(y, ada_model.predict(X))

print("Single tree accuracy:", acc_tree)
print("Random Forest accuracy:", acc_rf)
print("AdaBoost accuracy:", acc_ada)
`,
  datasetUrl: "/datasets/employee_attrition.csv",
  datasetPreviewMd: csvPreviewMd("employee_attrition.csv"),
  autograderCode:
    AUTOGRADER_PREAMBLE +
    `
_check(lambda: hasattr(tree_model, "tree_"), "tree_model has been fitted", 10)
_check(lambda: hasattr(rf_model, "estimators_") and len(rf_model.estimators_) == 100, "rf_model was fit with 100 trees", 20)
_check(lambda: hasattr(ada_model, "estimators_"), "ada_model has been fitted", 20)
_check(lambda: acc_rf >= acc_tree, "Random Forest matches or beats the single tree", 25)
_check(lambda: acc_ada >= acc_tree, "AdaBoost matches or beats the single tree", 25)
` + finalizeResult(),
  maxScore: 100,
  estMinutes: 45,
});

