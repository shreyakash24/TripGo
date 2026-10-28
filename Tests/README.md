# TripGo unit tests (Basis Path Testing)

Copy the folders into your cloned TripGo repo, keeping the same paths:

  backend/tests/*.test.js, backend/tests/helpers.js  -> TripGo/backend/tests/
  frontend/tests/useCreateBooking.test.js            -> TripGo/frontend/tests/
  frontend/vitest.config.js                          -> TripGo/frontend/

Install dev dependencies:

  cd backend  && npm i -D vitest @vitest/coverage-v8
  cd frontend && npm i -D vitest @vitest/coverage-v8 jsdom @testing-library/react

Run:

  cd backend  && npx vitest run --coverage
  cd frontend && npx vitest run --coverage

Expected: backend 26 tests passed, frontend 6 tests passed.
No database or running server is needed (database, bcrypt and JWT are mocked in the controller tests).
