import { UnprocessableEntityException, ValidationError } from '@nestjs/common';

export function validationExceptionFactory(errors: ValidationError[]) {
  const errorsList = flattenValidationErrors(errors);

  return new UnprocessableEntityException({
    errors: errorsList,
  });
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath?: string,
): string[] {
  return errors.flatMap((error) => {
    const currentPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    const ownMessages = error.constraints
      ? Object.values(error.constraints).map((message) => String(message))
      : [];

    const childMessages = error.children?.length
      ? flattenValidationErrors(error.children, currentPath)
      : [];

    return ownMessages.length > 0
      ? ownMessages.map((message) =>
          message.replace(error.property, currentPath),
        )
      : childMessages;
  });
}
