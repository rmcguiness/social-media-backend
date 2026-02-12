export const successEmail = (name: string, email: string, frontendBaseUrl: string) => {
	return {
		from: {
			name: 'Social Media App',
			address: 'noreply@socialmediaapp.com',
		},
		to: {
			name: name,
			address: email,
		},
		subject: 'Welcome! Your account is ready',
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
				<div style="text-align: center; margin-bottom: 2rem;">
					<div style="
						width: 80px;
						height: 80px;
						background-color: #10b981;
						border-radius: 50%;
						display: inline-flex;
						align-items: center;
						justify-content: center;
						margin-bottom: 1rem;
					">
						<span style="font-size: 48px;">✓</span>
					</div>
				</div>
				
				<h1 style="
					color: #1a1a1a;
					font-size: 28px;
					font-weight: 600;
					margin-bottom: 1rem;
					text-align: center;
				">
					You're all set, ${name}!
				</h1>
				
				<p style="
					color: #4a4a4a;
					font-size: 16px;
					line-height: 1.6;
					margin-bottom: 1.5rem;
					text-align: center;
				">
					Your account has been successfully verified. You can now start using Social Media App!
				</p>
				
				<div style="text-align: center; margin: 2rem 0;">
					<a
						href="${frontendBaseUrl}/login"
						style="
							display: inline-block;
							background-color: #2563eb;
							color: #ffffff;
							padding: 14px 32px;
							border-radius: 8px;
							text-decoration: none;
							font-weight: 600;
							font-size: 16px;
						"
					>
						Log In Now
					</a>
				</div>
				
				<div style="
					background-color: #f9fafb;
					border-radius: 8px;
					padding: 1.5rem;
					margin-top: 2rem;
				">
					<h3 style="
						color: #1a1a1a;
						font-size: 18px;
						font-weight: 600;
						margin-bottom: 1rem;
					">
						What's next?
					</h3>
					<ul style="
						color: #4a4a4a;
						font-size: 14px;
						line-height: 1.8;
						margin: 0;
						padding-left: 1.5rem;
					">
						<li>Complete your profile with a photo and bio</li>
						<li>Find and follow interesting people</li>
						<li>Share your first post</li>
						<li>Join conversations and connect with others</li>
					</ul>
				</div>
				
				<p style="
					color: #6b7280;
					font-size: 14px;
					line-height: 1.5;
					margin-top: 2rem;
					padding-top: 2rem;
					border-top: 1px solid #e5e7eb;
					text-align: center;
				">
					Questions? Need help? We're here for you.<br/>
					Visit our <a href="${frontendBaseUrl}/help" style="color: #2563eb;">Help Center</a> or reply to this email.
				</p>
			</div>
		`.trim(),
	};
};
