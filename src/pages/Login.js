import LoginForm from '../components/auth/LoginForm';

export default function Login() {
	return (
		<div className='min-h-screen dark:bg-dark_bg_1 flex items-center justify-center py-[19px] overflow-hidden'>
			<div className='flex w-[1600px] mx-auto h-full'>
				{/* login form */}
				<LoginForm />
			</div>
		</div>
	);
}
