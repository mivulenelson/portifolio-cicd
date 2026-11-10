output "state_bucket_name" {
  description = "Put this in the GitHub variable TF_STATE_BUCKET"
  value       = aws_s3_bucket.state.bucket
}

output "github_actions_role_arn" {
  description = "Put this in the GitHub variable AWS_ROLE_ARN"
  value       = aws_iam_role.github_actions.arn
}
