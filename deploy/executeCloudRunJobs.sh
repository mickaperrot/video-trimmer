#!/bin/bash

# Get the list of Cloud Run jobs with no executions
job_list=$(gcloud run jobs list \
  --filter="status.latestCreatedExecution.creationTimestamp = ''" \
  --format="value(metadata.name)")

# Loop through the list of jobs
for job_name in $job_list; do
  echo "Executing job: $job_name"

  gcloud run jobs execute "$job_name" --region=europe-west1

  echo "Job $job_name executed."
done

echo "All jobs executed."