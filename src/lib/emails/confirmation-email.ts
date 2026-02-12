export const confirmationEmail = (
	name: string,
	email: string,
	apiBaseUrl: string,
	userId: number
) => {
	return {
		from: {
			name: 'Social Media App',
			address: 'noreply@socialmediaapp.com',
		},
		to: {
			name: name,
			address: email,
		},
		subject: 'Confirm your email address',
		html: `
			<div style="
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
				max-width: 600px;
				margin: 2rem auto;
				padding: 2rem;
				background-color: #ffffff;
				border-radius: 12px;
				box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
			">
				<h1 style="
					color: #1a1a1a;
					font-size: 28px;
					font-weight: 600;
					margin-bottom: 1rem;
				">
					Welcome to Social Media App! 🎉
				</h1>
				
				<p style="
					color: #4a4a4a;
					font-size: 16px;
					line-height: 1.6;
					margin-bottom: 1.5rem;
				">
					Hi ${name},
				</p>
				
				<p style="
					color: #4a4a4a;
					font-size: 16px;
					line-height: 1.6;
					margin-bottom: 1.5rem;
				">
					Thank you for signing up! To get started, please confirm your email address by clicking the button below.
				</p>
				
				<div style="text-align: center; margin: 2rem 0;">
					<a
						href="${apiBaseUrl}/api/auth/confirm-email?user_id=${userId}"
						style="
							display: inline-block;
							background-color: #2563eb;
							color: #ffffff;
							padding: 14px 32px;
							border-radius: 8px;
							text-decoration: none;
							font-weight: 600;
							font-size: 16px;
							transition: background-color 0.2s;
						"
					>
						Confirm Email Address
					</a>
				</div>
				
				<p style="
					color: #6b7280;
					font-size: 14px;
					line-height: 1.5;
					margin-top: 2rem;
					padding-top: 2rem;
					border-top: 1px solid #e5e7eb;
				">
					This link will expire in 15 minutes. If you didn't create an account, please ignore this email.
				</p>
				
				<p style="
					color: #6b7280;
					font-size: 12px;
					margin-top: 1rem;
				">
					If the button doesn't work, copy and paste this link into your browser:<br/>
					<a href="${apiBaseUrl}/api/auth/confirm-email?user_id=${userId}" style="color: #2563eb;">
						${apiBaseUrl}/api/auth/confirm-email?user_id=${userId}
					</a>
				</p>
			</div>
		`.trim(),
	};
};
