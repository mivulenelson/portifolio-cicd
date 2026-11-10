locals {
  services = toset(["backend", "frontend"])
}

# One private image repository per container.
resource "aws_ecr_repository" "app" {
  for_each = local.services

  name                 = "${var.project_name}-${each.key}"
  image_tag_mutability = "MUTABLE"
  force_delete         = true # lets `terraform destroy` remove the repositories even when they hold images

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Keep only the 10 newest images in each repository.
resource "aws_ecr_lifecycle_policy" "app" {
  for_each = aws_ecr_repository.app

  repository = each.value.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}
