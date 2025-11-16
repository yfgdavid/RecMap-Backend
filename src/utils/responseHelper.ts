import { Response } from "express";

/**
 * Formato padronizado de resposta de sucesso
 */
export function successResponse(
  res: Response,
  data: any,
  message: string = "Operação realizada com sucesso.",
  statusCode: number = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    type: "success",
    data,
  });
}

/**
 * Formato padronizado de resposta de erro
 */
export function errorResponse(
  res: Response,
  message: string = "Erro ao processar solicitação.",
  statusCode: number = 500,
  details?: string
) {
  return res.status(statusCode).json({
    success: false,
    message,
    type: "error",
    ...(details && { details }),
  });
}

/**
 * Formato padronizado de resposta de validação
 */
export function validationResponse(
  res: Response,
  message: string = "Dados inválidos.",
  statusCode: number = 400,
  errors?: any
) {
  return res.status(statusCode).json({
    success: false,
    message,
    type: "validation",
    ...(errors && { errors }),
  });
}

/**
 * Formato padronizado de resposta de não autorizado
 */
export function unauthorizedResponse(
  res: Response,
  message: string = "Acesso negado. Autenticação necessária."
) {
  return res.status(401).json({
    success: false,
    message,
    type: "unauthorized",
  });
}

/**
 * Formato padronizado de resposta de não encontrado
 */
export function notFoundResponse(
  res: Response,
  message: string = "Recurso não encontrado."
) {
  return res.status(404).json({
    success: false,
    message,
    type: "not_found",
  });
}

