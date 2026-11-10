output "app_url" {
  description = "Public address of the deployed application"
  value       = "http://${aws_lb.app.dns_name}"
}

output "deployed_version" {
  description = "Image tag (build ID) currently deployed"
  value       = var.image_tag
}

output "ecr_repository_urls" {
  description = "Image repositories created for the two containers"
  value       = { for name, repo in aws_ecr_repository.app : name => repo.repository_url }
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}
