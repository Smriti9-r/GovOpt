
from sqlalchemy import inspect, text

from backend.database import engine


def migrate():
    inspector = inspect(engine)

    if "citizen_feedback" not in inspector.get_table_names():
        print("Citizen feedback table does not exist.")
        return

    columns = [
        column["name"]
        for column in inspector.get_columns("citizen_feedback")
    ]

    with engine.begin() as connection:

        if "reference_id" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE citizen_feedback "
                    "ADD COLUMN reference_id VARCHAR(40)"
                )
            )
            print("Added reference_id column.")

        connection.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS "
                "ix_citizen_feedback_reference_id "
                "ON citizen_feedback (reference_id)"
            )
        )

        connection.execute(
            text(
                "UPDATE citizen_feedback "
                "SET citizen_name = 'Anonymous'"
            )
        )

    print("Feedback migration completed successfully.")
    print("Existing citizen names have been anonymised.")


if __name__ == "__main__":
    migrate()
