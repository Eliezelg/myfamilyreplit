
import { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';

export function sanitizeInputs(req: Request, res: Response, next: NextFunction) {
  // Fonction pour nettoyer les chaînes de texte
  const sanitize = (input: any): any => {
    if (typeof input === 'string') {
      return sanitizeHtml(input, {
        allowedTags: [], // Ne permet aucune balise HTML
        allowedAttributes: {},
        disallowedTagsMode: 'discard'
      });
    } else if (Array.isArray(input)) {
      return input.map(item => sanitize(item));
    } else if (input !== null && typeof input === 'object') {
      const result: any = {};
      Object.keys(input).forEach(key => {
        // Ignorer les champs password pour ne pas modifier le mot de passe
        if (key === 'password' || key === 'passwordConfirm') {
          result[key] = input[key];
        } else {
          result[key] = sanitize(input[key]);
        }
      });
      return result;
    }
    return input;
  };

  // Nettoyer le corps de la requête
  if (req.body) {
    req.body = sanitize(req.body);
  }

  // Nettoyer les paramètres de la requête
  if (req.params) {
    req.params = sanitize(req.params);
  }

  // Nettoyer les paramètres de l'URL
  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
}
