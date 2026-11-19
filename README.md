# GovOpt – Uttarakhand District-Level Resource Allocation & Planning Platform

**Understand needs. Plan better. Allocate smarter.**

GovOpt is a data-driven decision-support platform designed to help users understand district-level development needs and explore different approaches to allocating government resources across all 13 districts of Uttarakhand.

The platform brings together education, drinking water, healthcare, and population data to analyse development gaps, calculate district-level need scores, and compare budget allocation scenarios.

**Live Website:** https://gov-opt.vercel.app/

**GitHub Repository:** https://github.com/Smriti9-r/GovOpt

---

## Project Objectives

- Analyse development needs across Uttarakhand's 13 districts.
- Identify differences in education, healthcare, and drinking water indicators.
- Calculate district-level need scores and rankings.
- Compare different government budget allocation strategies.
- Explore how population and development needs affect resource distribution.
- Make resource planning more transparent and easier to understand.

## Key Features

### 1. Overview Dashboard
Provides an overview of district-level development information through visualisations, statistics, and an interactive map.

### 2. District Exploration
Allows users to explore district-level information and understand development indicators across different sectors.

### 3. District Comparison
Enables users to compare districts and identify differences in their development requirements.

### 4. Budget Simulation
Allows authorised policy makers to experiment with different budget allocation assumptions and explore possible outcomes.

### 5. Scenario Comparison
Provides a way to compare alternative allocation scenarios and understand how different approaches affect districts.

### 6. Policy Insights
Presents analytical insights to help users understand allocation patterns and district-level priorities.

### 7. Citizen Feedback Portal
Provides a channel for citizens to submit feedback through the platform.

### 8. Admin Dashboard
Supports administrative functions, including user and feedback management.

### 9. Report Generation
Allows users to generate PDF reports containing relevant project information and analytical results.

## Data and Methodology

GovOpt uses district-level datasets covering:

- Education
- Drinking Water
- Healthcare
- Projected Population

Python and Pandas are used for data processing, validation, and analysis. District-level need scores are calculated using the selected indicators and sector weights.

The platform explores multiple allocation approaches, including:

- Equal allocation
- Need-based allocation
- Minimum-guarantee allocation
- Population-adjusted allocation

An illustrative budget of ₹500 crore was used in the project's allocation experiments.

**Important:** The allocation results are simulated planning scenarios. They are not official government funding decisions or sanctioned budgets.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL, Neon |
| Data Analysis | Pandas, NumPy |
| Optimisation | PuLP |
| Maps | Leaflet, React-Leaflet |
| Charts | Recharts |
| PDF Reports | ReportLab |
| Authentication | JWT-based authentication |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Version Control | Git, GitHub |

## System Architecture

The application follows a frontend-backend architecture.

1. District-level datasets are processed and analysed using Python.
2. Need scores, rankings, and allocation scenarios are calculated.
3. FastAPI exposes backend functionality through API endpoints.
4. PostgreSQL stores application-related records.
5. The React frontend retrieves information from the backend.
6. Users interact with dashboards, maps, comparisons, simulations, and reports.

## Running the Project Locally

### Prerequisites

- Python
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Smriti9-r/GovOpt.git
cd GovOpt
```

### 2. Start the Backend

Open a terminal in the project root:

```bash
python -m venv venv
```

Activate the virtual environment on Windows:

```bash
venv\Scripts\activate
```

Install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

Start the FastAPI server:

```bash
uvicorn backend.main:app --reload
```

Backend address:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside the frontend folder:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

Open the local frontend URL displayed in the terminal.

**Note:** Configure the required database environment variables before starting the backend. Never upload passwords, database credentials, secret keys, or `.env` files to GitHub.

## Deployment

GovOpt uses the following deployment services:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** Neon PostgreSQL

Live application: https://gov-opt.vercel.app/

## Project Scope and Limitations

- The platform is intended for decision support and planning exploration.
- Allocation results depend on the selected indicators, weights, assumptions, and constraints.
- Simulated allocations should not be interpreted as actual government expenditure.
- Reliable intervention costs and measured outcomes would be required for estimating real-world policy impact.

## Future Improvements

- More detailed geographical accessibility and remoteness analysis.
- Integration of additional verified district-level datasets.
- Improved allocation modelling using more detailed intervention-cost information.
- Further improvements to reporting and decision-support capabilities.

---

**GovOpt – Uttarakhand District-Level Resource Allocation & Planning Platform**

Developed as an academic project focused on data-driven analysis, budget optimisation, and transparent resource planning.
