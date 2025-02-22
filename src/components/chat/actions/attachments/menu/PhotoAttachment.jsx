import React, { useRef } from 'react';
import { PhotoIcon } from '../../../../../svg';
import { useDispatch } from 'react-redux';
import { addFiles } from '../../../../../Slices/chatSlice';
import { getFileType } from '../../../../../utils/file';
const PhotoAttachment = () => {
	const inputRef = useRef(null);
	const dispatch = useDispatch();

	const imageHandler = (e) => {
		let files = Array.from(e.target.files);
		files.forEach((file) => {
			if (
				file.type !== 'image/jpeg' &&
				file.type !== 'image/png' &&
				file.type !== 'image/gif' &&
				file.type !== 'image/webp' &&
				file.type !== 'video/mp4' &&
				file.type !== 'video/mpeg' &&
				file.type !== 'video/webm'
			) {
				files = files.filter((item) => item.name !== file.name);
				return;
			} else if (file.size > 1024 * 1024 * 10) {
				return;
			} else {
				const reader = new FileReader();
				reader.readAsDataURL(file);
				reader.onload = (e) => {
					dispatch(
						addFiles({
							file: file,
							fileData: e.target.result,
							type: getFileType(file.type),
						})
					);
				};
			}
		});
	};

	const limitFileSelection = (event) => {
		const maxFiles = 20;
		const files = event.target.files;
		// Check if the number of selected files exceeds the limit
		if (files && files.length > maxFiles) {
			event.target.value = null; // Clear the selected files
		}
	};

	return (
		<li>
			<button
				type='button'
				className='bg-[#BF59CF] rounded-full'
				onClick={() => inputRef.current.click()}
			>
				<PhotoIcon />

				<input
					type='file'
					hidden
					multiple
					ref={inputRef}
					accept='image/png, image/jpeg, image/gif, image/webp, video/mp4, video/mpeg, video/webm'
					onChange={imageHandler}
					onInput={limitFileSelection}
				/>
			</button>
		</li>
	);
};

export default PhotoAttachment;
