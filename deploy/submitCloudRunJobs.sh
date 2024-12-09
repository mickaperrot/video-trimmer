#!/bin/bash

# Replace below variables (ex: gs://MYBUCKET/PATH)
gcs_bucket="MYBUCKET"
gcs_path="GCS PATH TO FILES"
image="europe-west1-docker.pkg.dev/mickael-canal-genai-poc/cloud-run-source-deploy/testvideo"
split_duration=1200
root_directory=$(echo "$gcs_path" | cut -d '/' -f 2)

# Get the list of video files from Google Cloud Storage
video_files=$(gsutil ls gs://$gcs_bucket/$gcs_path)

# Initialize job counter
job_counter=1

# Loop through the array of video files
for video_file in $video_files; do
  echo "Processing video file: $video_file"

  # Remove "gs://BUCKET/" from the beginning of the video file path
  video_file_path=$(echo "$video_file" | sed "s/gs:\/\/$gcs_bucket\///")

  job_name="${current_time}-${job_counter}"

  gcloud run jobs deploy "$job_name" \
    --image "$image" \
    --region europe-west1 \
    --set-env-vars=BUCKET_NAME="$gcs_bucket",\
VIDEO_FILENAME="$video_file_path",\
SPLIT_DURATION="$split_duration",\
INPUT_DIR="$root_directory",\
OUTPUT_DIR="$root_directory-trimmed"- \
    --memory 16Gi \
    --task-timeout=24h \
    --cpu=4

  echo "Job $job_name submitted for $video_file"

  # Increment job counter
  job_counter=$((job_counter + 1))
done

echo "All jobs submitted."