interface DjangoErrorDetail {
  string: string;
  code: string;
}

interface NewApiErrorResponse {
  error: {
    message: string;
    code: number;
    details: any;
  };
}

interface OldApiErrorResponse {
  detail?: string | DjangoErrorDetail;
  non_field_errors?: Array<string | DjangoErrorDetail>;
  [key: string]: any;
}

type ApiErrorResponse = NewApiErrorResponse | OldApiErrorResponse;

interface ApiErrorResponse {
  error: {
    message: string;
    code: number;
    details: any;
  };
}

interface ApiError {
  response?: {
    data: ApiErrorResponse | string;
    status: number;
  };
  message?: string;
}

export function parseApiError(error: ApiError): { title: string; message: string } {
  try {
    let errorMessage = 'An error occurred';
    let errorTitle = 'Error';

    if (error.response?.data) {
      // Handle string error messages
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
        errorTitle = 'Error';
      }
      // Handle structured error responses
      else if ('error' in error.response.data) {
        const { message, code, details } = error.response.data.error;
        errorMessage = message;

        // Set appropriate title based on error code
        switch (code) {
          case 400:
            errorTitle = 'Validation Error';
            break;
          case 401:
            errorTitle = 'Unauthorized';
            break;
          case 403:
            errorTitle = 'Access Denied';
            break;
          case 404:
            errorTitle = 'Not Found';
            break;
          case 500:
            errorTitle = 'Server Error';
            break;
          default:
            errorTitle = 'Error';
        }

        // If there are additional details, append them to the message
        if (details) {
          if (typeof details === 'object') {
            const detailMessages = Object.entries(details)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ');
            errorMessage = `${message} (${detailMessages})`;
          } else {
            errorMessage = `${message} (${details})`;
          }
        }
      }
    }

    // Set appropriate title based on error message content
    if (errorMessage.toLowerCase().includes('pending approval')) {
      errorTitle = 'Approval Pending';
    } else if (errorMessage.toLowerCase().includes('no account found')) {
      errorTitle = 'Account Not Found';
    } else if (errorMessage.toLowerCase().includes('inactive')) {
      errorTitle = 'Account Inactive';
    } else if (errorMessage.toLowerCase().includes('already exists')) {
      errorTitle = 'Account Exists';
    } else if (errorMessage.toLowerCase().includes('rejected')) {
      errorTitle = 'Registration Rejected';
    } else if (errorMessage.toLowerCase().includes('invalid credentials')) {
      errorTitle = 'Invalid Credentials';
    } else if (errorMessage.toLowerCase().includes('unauthorized')) {
      errorTitle = 'Unauthorized';
    } else if (errorMessage.toLowerCase().includes('forbidden')) {
      errorTitle = 'Access Denied';
    } else if (errorMessage.toLowerCase().includes('not found')) {
      errorTitle = 'Not Found';
    } else if (errorMessage.toLowerCase().includes('invalid email domain')) {
      errorTitle = 'Invalid Email Domain';
    }

    return { title: errorTitle, message: errorMessage };
  } catch (err) {
    console.error('Error parsing API error:', err);
    return {
      title: 'Error',
      message: error.message || 'An unexpected error occurred'
    };
  }
} 